"use client";

import type React from "react";
import { useState, useCallback, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { MediaMasonry } from "@/components/media-masonry";
import { FolderNavigation } from "@/components/folder-navigation";
import { EditableTitle } from "@/components/editable-title";
import { useToast } from "@/hooks/use-toast";
import { createMediaFile, processFolderUpload } from "@/lib/utils/file-utils";
import { Upload, FolderOpen, Share2, UploadIcon, Info } from "lucide-react";
import type { EXIFData, Folder, StorageProvider } from "@/types";
import { MediaCarousel } from "@/components/media-carousel";
import { ShareDialog } from "@/components/share-dialog";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useDialog } from "@/hooks/use-dialog";
import { useProjects } from "@/hooks/api/useProjects";
import { Project } from "@/types/project";
import { useS3 } from "@/hooks/api/useS3";
import { useRatings } from "@/hooks/api/useRatings";
import {
  FolderPreviewActions,
  FolderPreviewContent,
} from "@/components/folder-preview-dialog";
import { GlobalFileUploader } from "@/components/global-file-uploader";
import { useDropbox } from "@/hooks/api/useDropbox";
import { useAuth } from "@/hooks/api/useAuth";
import GlowingButton from "@/components/glowing-button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Rating } from "@/lib/api/ratingsApi";
import { blurFadeInVariants } from "@/lib/motion";
import UpgradePage from "../upgrade/page";
import { useStorage } from "@/hooks/api/useStorage";
import { useMetadata } from "@/hooks/api/useMetadata";

export default function UploadViewWrapper() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full">
          <div className="flex items-center justify-center h-[80vh]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
        </div>
      }
    >
      <UploadView />
    </Suspense>
  );
}

export function UploadView() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("dropbox_token");
  const router = useRouter()

  const { user } = useAuth();

  const { authUrl } = useDropbox(tokenFromUrl || "");
  const { uploadFiles, isUploading: isUploadingToS3 } = useS3();
  const { toast } = useToast();
  const { show, hide, updateProps } = useDialog();

  const {
    projects: { data: personalProjects = [] },
    createProject: {
      mutateAsync: createProject,
      isPending: isUploadingProject,
      data: project,
    },
    updateProject: { mutateAsync: updateProject },
    getProject: { mutateAsync: getProject },
    addProjectFiles: { mutateAsync: addProjectFiles },
  } = useProjects();

  const { batchCreateImageMetadata: { mutateAsync: batchCreateImageMetadata } } = useMetadata()

  const {
    ratings,
    queuedRatings,
    setQueuedRatings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    handleRatingChange
  } = useRatings();

  const {
    stats: { data: storageStats },
  } = useStorage();

  const isUploading = isUploadingProject || isUploadingToS3;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [createdProjects, setCreatedProjects] = useState<Project[]>([]);
  const [currentFolderIndex, setCurrentFolderIndex] = useState(0);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  const [isAnyMediaHovered, setIsAnyMediaHovered] = useState(false);
  const gradientSize = useMotionValue(250);
  const gradientOpacity = useMotionValue(0.05);
  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, {
    stiffness: 150,
    damping: 30,
  });

  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([latestX, latestY, latestSize, latestOpacity]) =>
      `radial-gradient(circle ${latestSize}px at ${latestX}% ${latestY}%, rgba(255,255,255,${latestOpacity}) 0%, rgba(255,255,255,${(latestOpacity as number) * 0.25
      }) 50%, transparent 100%)`
  );

  const currentFolder = folders[currentFolderIndex];
  const currentProject = createdProjects[currentFolderIndex];

  const handleNewFolders = useCallback(
    async (files: File[]) => {
      if (user?.membership?.membership_id === "artist" && personalProjects.length >= 3) {
        show({
          title: "Upgrade",
          content: () => <UpgradePage />,
          containerProps: { className: "max-w-[90%]" }
        })
        return
      }

      if (files.length === 0) return;
      const newFolders = await processFolderUpload(files);
      if (newFolders.length === 0) {
        toast({
          title: "No Media Found",
          description: "Please upload folders containing media files.",
          variant: "destructive",
        });
        return;
      }
      show({
        title: "Review Folders",
        content: FolderPreviewContent,
        contentProps: {
          editable: !project || !isUploading,
          folders: newFolders,
          onRename: (folderIndex: number, newName: string) => {
            newFolders[folderIndex].name = newName;
            updateProps({ folders: newFolders })
          },
          onCancel: hide,
          onUpload: async (
            confirmedFolders: Folder[],
            currentFolderIndex: number,
            storageProvider: StorageProvider,
            selectedTenant: string
          ) => {
            setFolders((prev) => [...prev, ...confirmedFolders]);
            setCurrentFolderIndex(confirmedFolders.length ? 0 : 0);

            const provider = project?.b2_folder_path ? "b2" :
              project?.dropbox_folder_path ? "dropbox" :
                storageProvider;

            Promise.all(
              confirmedFolders.map(
                async (folder) => await handleUpload(folder, currentFolderIndex, provider, selectedTenant)
              )
            );
            hide();
          },
        },
        actions: FolderPreviewActions,
      });
    },
    [project, isUploading]
  );

  const handleAddNewFolders = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        toast({
          title: "No Medias Found",
          description: "Please upload folders containing image files.",
          variant: "destructive",
        });
        return;
      }

      // Using a Map instead of an object
      const mockFolder = new Map<string, File[]>();
      mockFolder.set(project?.name || "Untitled Project", files);

      const folderArray = await Promise.all(
        Array.from(mockFolder.entries()).map(
          async ([folderName, folderFiles]) => ({
            id: `folder-${folderName}-${Date.now()}`,
            name: folderName,
            media: await Promise.all(
              folderFiles.map((file) => createMediaFile(file, folderName))
            ),
            createdAt: new Date(),
          })
        )
      );

      show({
        title: "Review Folders",
        content: FolderPreviewContent,
        contentProps: {
          editable: !!project || !isUploading,
          folders: folderArray,
          onRename: (folderIndex: number, newName: string) => {
            folderArray[folderIndex].name = newName;
          },
          onCancel: hide,
          onUpload: async (
            confirmedFolders: Folder[],
            currentFolderIndex: number,
            storageProvider: StorageProvider,
          ) => {
            setFolders((prev) => [...prev, ...confirmedFolders]);
            setCurrentFolderIndex(confirmedFolders.length ? 0 : 0);

            const provider = project?.b2_folder_path ? "b2" :
              project?.dropbox_folder_path ? "dropbox" :
                storageProvider;

            Promise.all(
              confirmedFolders.map(
                async (folder) =>
                  await handleAddProjectFiles(folder, currentFolderIndex, provider)
              )
            );
            hide();
          },
        },
        actions: FolderPreviewActions,
      });
    },
    [project, isUploading]
  );

  const handleFolderRename = useCallback(
    (newName: string) => {
      if (!currentFolder) return;
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === currentFolder.id ? { ...folder, name: newName } : folder
        )
      );
    },
    [currentFolder]
  );

  const handleUpdateProject = useCallback(
    async (newName: string) => {
      if (!currentProject) return;
      try {
        await updateProject({
          projectId: currentProject.project_id,
          data: {
            name: newName,
          },
        });

        const updatedProject = await getProject(currentProject.project_id);

        setCreatedProjects((prev) =>
          prev.map((proj) =>
            proj.project_id === updatedProject.project_id
              ? updatedProject
              : proj
          )
        );

        handleFolderRename(newName)

        toast({ title: "Project name updated" });
      } catch {
        toast({ title: "Failed to update project", variant: "destructive" });
      }
    },
    [currentProject, updateProject]
  );

  const handlePreviousFolder = () =>
    setCurrentFolderIndex((prev) => Math.max(0, prev - 1));
  const handleNextFolder = () =>
    setCurrentFolderIndex((prev) => Math.min(folders.length - 1, prev + 1));

  const handleUpload = async (folder: Folder, folderIndex = 0, storageProvider: StorageProvider = "dropbox", selectedTenant?: string) => {
    const uploadFolder = folder || currentFolder;
    if (!uploadFolder || !storageStats) return;
    try {
      const fileMetadata: Record<string, EXIFData> = uploadFolder.media.reduce(
        (acc, img) => {
          if (img.metadata) {
            acc[img.name] = img.metadata;
          }
          return acc;
        },
        {} as Record<string, EXIFData>
      );

      const mediaFiles = uploadFolder.media.map((img) => img.file);
      const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);

      // Check if adding this would exceed allocated storage
      if (storageProvider === "b2" && storageStats.used + totalSize > storageStats.allocated) {
        show({
          title: "Upgrade",
          content: () => <UpgradePage />,
          containerProps: { className: "max-w-[90%]" }
        })
        return
      }

      const tempFileLocations = await uploadFiles(mediaFiles);

      const project = await createProject({
        name: uploadFolder.name,
        tenant_id: selectedTenant,
        file_locations: tempFileLocations,
        storage_provider: storageProvider,
      });

      if (!!Object.keys(fileMetadata).length) {
        await batchCreateImageMetadata({
          project_id: project.project_id,
          file_metadata: fileMetadata,
        });
      }
      await Promise.all(
        queuedRatings.map(async (rating) =>
          createRating({
            project_id: project.project_id,
            value: rating.value,
            media_name: rating.media_name,
          })
        )
      );
      setQueuedRatings([]);
      setCreatedProjects((projects) => {
        const updatedProjects = [...projects];
        updatedProjects[folderIndex] = project;
        return updatedProjects;
      });
    } catch { }
  };

  const handleAddProjectFiles = async (folder: Folder, folderIndex = 0, storageProvider: StorageProvider) => {
    const uploadFolder = folder || currentFolder;
    if (!uploadFolder || !project || !storageStats) return;
    try {
      const fileMetadata: Record<string, EXIFData> = uploadFolder.media.reduce(
        (acc, img) => {
          if (img.metadata) {
            acc[img.name] = img.metadata;
          }
          return acc;
        },
        {} as Record<string, EXIFData>
      );

      const mediaFiles = uploadFolder.media.map((img) => img.file);
      const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);

      // Check if adding this would exceed allocated storage
      if (storageProvider === "b2" && storageStats.used + totalSize > storageStats.allocated) {
        show({
          title: "Upgrade",
          content: () => <UpgradePage />,
          containerProps: { className: "max-w-[90%]" }
        })
        return
      }

      const tempFileLocations = await uploadFiles(mediaFiles);
      await addProjectFiles({
        projectId: project?.project_id,
        file_locations: tempFileLocations,
      });

      if (!!Object.keys(fileMetadata).length) {
        await batchCreateImageMetadata({
          project_id: project.project_id,
          file_metadata: fileMetadata,
        });
      }

      await getProject(currentProject.project_id);
    } catch { }
  };

  const handleMediaClick = useCallback((imageIndex: number) => {
    setCarouselStartIndex(imageIndex);
    setIsCarouselOpen(true);
  }, []);

  const handleCloseCarousel = useCallback(() => setIsCarouselOpen(false), []);

  const handleShare = () => {
    if (!currentFolder || !currentProject) return;
    show({
      content: () => <ShareDialog project={currentProject} onClose={hide} />,
    });
  };

  const handleGlobalMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set(((e.clientX - rect.left) / rect.width) * 100);
      y.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [x, y]
  );

  const handleMediaHoverChange = useCallback(
    (isHovering: boolean) => setIsAnyMediaHovered(isHovering),
    []
  );

  useEffect(() => {
    gradientSize.set(isAnyMediaHovered ? 400 : 250);
    gradientOpacity.set(isAnyMediaHovered ? 0.2 : 0.05);
  }, [isAnyMediaHovered, gradientSize, gradientOpacity]);

  useEffect(() => {
    if (currentProject?.project_id) getRatings(currentProject.project_id);
  }, [currentProject]);

  if (!authUrl.data && !user?.dropbox?.access_token) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (user && !user?.membership?.membership_id || !["active", "trialing"].includes(user?.membership?.status || "")) {
    router.push("/upgrade")
    return
  }

  if (false && authUrl.data && !user?.dropbox?.access_token) {
    return (
      <motion.div
        className={cn("min-h-dvh bg-background relative overflow-hidden")}
        onMouseMove={handleGlobalMouseMove}
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: gradient,
          backgroundAttachment: "fixed",
          backgroundPosition: `${springX.get()}% ${springY.get()}%`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-full min-h-dvh flex flex-col items-center justify-center text-center px-4 space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            Connect your Dropbox
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            To continue, please connect your Dropbox account. This allows us to
            securely store and manage your files.
          </p>
          <Link href={authUrl.data?.url || ""}>
            <GlowingButton>Connect</GlowingButton>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className={cn("min-h-dvh bg-background relative overflow-hidden")}
        onMouseMove={handleGlobalMouseMove}
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: gradient,
          backgroundAttachment: "fixed",
          backgroundPosition: `${springX.get()}% ${springY.get()}%`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        {(() => {
          switch (!!currentFolder) {
            case true:
              return (
                <>
                  <GlobalFileUploader
                    onFilesSelected={handleAddNewFolders}
                    directory={true}
                  />

                  <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                      <div className="space-y-4">
                        <EditableTitle
                          title={currentFolder.name}
                          onSave={
                            currentProject
                              ? handleUpdateProject
                              : handleFolderRename
                          }
                          editable={!isUploading}
                        />
                        <FolderNavigation
                          currentIndex={currentFolderIndex}
                          totalFolders={folders.length}
                          onPrevious={handlePreviousFolder}
                          onNext={handleNextFolder}
                        />
                      </div>
                    </div>

                    <div className="mb-20">
                      <div className="mb-6 flex items-center justify-between">
                        <p className="text-muted-foreground">
                          {currentFolder.media.length} item
                          {currentFolder.media.length !== 1 ? "s" : ""}
                        </p>
                        <Button
                          onClick={
                            currentProject?.share_url
                              ? handleShare
                              : () =>
                                handleUpload(
                                  currentFolder,
                                  currentFolderIndex
                                )
                          }
                          disabled={isUploading}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          {currentProject?.share_url ? (
                            <>
                              <Share2 className="h-4 w-4" />Share Folder
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {isUploading
                                ? "Uploading..."
                                : "Upload to Dropbox"}
                            </>
                          )}
                        </Button>
                      </div>

                      <MediaMasonry
                        projectId={project?.project_id || ""}
                        media={currentFolder.media}
                        metadata={[]}
                        ratings={[...queuedRatings, ...ratings]}
                        onMediaClick={handleMediaClick}
                        onRatingChange={(mediaName, value, ratingId) => handleRatingChange(mediaName, value, ratingId, currentProject)}
                        onMediaHoverChange={handleMediaHoverChange}
                        projectNotes={[]}
                        canEdit={user?.user_id === project?.user_id}
                      />
                    </div>

                    <MediaCarousel
                      project={currentProject}
                      media={currentFolder.media}
                      ratings={[...queuedRatings, ...ratings]}
                      initialIndex={carouselStartIndex}
                      isOpen={isCarouselOpen}
                      onClose={handleCloseCarousel}
                      onRatingChange={(mediaId, value, ratingId) => handleRatingChange(mediaId, value, ratingId, currentProject)}
                    />
                  </div>
                </>
              );

            default:
              return (
                <>
                  <GlobalFileUploader
                    onFilesSelected={handleNewFolders}
                    directory={true}
                  />

                  <motion.div
                    className="space-y-4"
                    variants={blurFadeInVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <FileUploader
                      onFilesSelected={handleNewFolders}
                      accept={{ "image/*": [] }}
                      maxFiles={1000}
                      // directory={true}
                      className="h-dvh w-screen max-w-full max-h-full flex items-center justify-center"
                    >
                      <div className="text-center space-y-4">
                        <div
                          className="
                            relative inline-flex
                            flex-col items-center justify-center gap-2
                            px-4 py-3
                            rounded-2xl
                            border border-white/20
                            bg-background/30
                            backdrop-blur-xl
                            overflow-hidden
                            opacity-60
                            hover:opacity-100
                            transition-all
                          "
                        >
                          <div className="absolute inset-0 opacity-30">
                            {/* Light refraction */}
                            <span
                              className="
                              absolute inset-0
                              bg-[radial-gradient(120%_100%_at_0%_0%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_60%)]
                              pointer-events-none
                            "
                            />

                            {/* Gradient border */}
                            <span
                              className="
                              absolute inset-0
                              p-[1px]
                              bg-gradient-to-r
                              from-white/40 via-white/10 to-white/20
                              opacity-40
                              group-hover:opacity-50
                              transition-opacity
                              pointer-events-none
                            "
                            />
                          </div>

                          {/* Content */}
                          <div className="relative z-10 flex flex-col items-start gap-2">
                            <div className="inline-flex items-center">
                              <FolderOpen className="h-8 w-8 text-muted-foreground mr-2" />
                              <h3 className="text-lg font-normal">
                                Upload Media Folders
                              </h3>
                            </div>

                            <p className="inline-flex items-center text-muted-foreground text-sm font-light">
                              <Info className="h-4 w-4 mr-1 shrink-0" />
                              Drag and drop folders containing images or videos, or click to browse
                            </p>
                            <Button className="m-4 self-center">
                              <UploadIcon />
                              Upload
                            </Button>
                          </div>
                        </div>
                      </div>
                    </FileUploader>
                  </motion.div>
                </>
              );
          }
        })()}
      </motion.div>
    </>
  );
}
