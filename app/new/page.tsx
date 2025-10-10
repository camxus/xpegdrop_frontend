"use client";

import type React from "react";
import { useState, useCallback, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { PinterestGrid } from "@/components/pinterest-grid";
import { FolderNavigation } from "@/components/folder-navigation";
import { EditableTitle } from "@/components/editable-title";
import { useToast } from "@/hooks/use-toast";
import { createImageFile, processFolderUpload } from "@/lib/utils/file-utils";
import { Upload, FolderOpen, Share2, UploadIcon } from "lucide-react";
import type { Folder } from "@/types";
import { ImageCarousel } from "@/components/image-carousel";
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
import { useSearchParams } from "next/navigation";
import { Rating } from "@/lib/api/ratingsApi";

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

  const { user } = useAuth();

  const { authUrl } = useDropbox(tokenFromUrl || "");
  const { uploadFiles, isUploading: isUploadingToS3 } = useS3();
  const { toast } = useToast();
  const { show, hide } = useDialog();

  const {
    createProject: {
      mutateAsync: createProject,
      isPending: isUploadingProject,
      data: project,
    },
    updateProject: { mutateAsync: updateProject },
    getProject: { mutateAsync: getProject },
    addProjectFiles: { mutateAsync: addProjectFiles },
  } = useProjects();

  const {
    ratings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    updateRating: { mutateAsync: updateRating },
  } = useRatings();

  const isUploading = isUploadingProject || isUploadingToS3;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [queuedRatings, setQueuedRatings] = useState<Rating[]>([]);
  const [createdProjects, setCreatedProjects] = useState<Project[]>([]);
  const [currentFolderIndex, setCurrentFolderIndex] = useState(0);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  const [isAnyImageHovered, setIsAnyImageHovered] = useState(false);
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
      `radial-gradient(circle ${latestSize}px at ${latestX}% ${latestY}%, rgba(255,255,255,${latestOpacity}) 0%, rgba(255,255,255,${
        (latestOpacity as number) * 0.25
      }) 50%, transparent 100%)`
  );

  const currentFolder = folders[currentFolderIndex];
  const currentProject = createdProjects[currentFolderIndex];

  const handleNewFolders = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const newFolders = await processFolderUpload(files);
      if (newFolders.length === 0) {
        toast({
          title: "No Images Found",
          description: "Please upload folders containing image files.",
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
          },
          onCancel: hide,
          onUpload: async (
            confirmedFolders: Folder[],
            currentFolderIndex: number
          ) => {
            setFolders((prev) => [...prev, ...confirmedFolders]);
            setCurrentFolderIndex(confirmedFolders.length ? 0 : 0);
            Promise.all(
              confirmedFolders.map(
                async (folder) => await handleUpload(folder, currentFolderIndex)
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
          title: "No Images Found",
          description: "Please upload folders containing image files.",
          variant: "destructive",
        });
        return;
      }

      // Using a Map instead of an object
      const mockFolder = new Map<string, File[]>();
      mockFolder.set(project?.name || "Untitled Project", files);

      const folderArray = Array.from(mockFolder.entries()).map(
        ([folderName, folderFiles]) => ({
          id: `folder-${folderName}-${Date.now()}`,
          name: folderName,
          images: folderFiles.map((file) => createImageFile(file, folderName)),
          createdAt: new Date(),
        })
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
            currentFolderIndex: number
          ) => {
            setFolders((prev) => [...prev, ...confirmedFolders]);
            setCurrentFolderIndex(confirmedFolders.length ? 0 : 0);
            Promise.all(
              confirmedFolders.map(
                async (folder) =>
                  await handleAddProjectFiles(folder, currentFolderIndex)
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
        setFolders((prev) =>
          prev.map((folder) =>
            folder.name === currentProject.name
              ? { ...folder, name: newName }
              : folder
          )
        );
        toast({ title: "Project name updated" });
      } catch {
        toast({ title: "Failed to update project", variant: "destructive" });
      }
    },
    [currentProject, updateProject, toast]
  );

  const handlePreviousFolder = () =>
    setCurrentFolderIndex((prev) => Math.max(0, prev - 1));
  const handleNextFolder = () =>
    setCurrentFolderIndex((prev) => Math.min(folders.length - 1, prev + 1));

  const handleUpload = async (folder: Folder, folderIndex = 0) => {
    const uploadFolder = folder || currentFolder;
    if (!uploadFolder) return;
    try {
      const imageFiles = uploadFolder.images.map((img) => img.file);
      const tempFileLocations = await uploadFiles(imageFiles);
      const project = await createProject({
        name: uploadFolder.name,
        file_locations: tempFileLocations,
      });
      await Promise.all(
        queuedRatings.map(async (rating) =>
          createRating({
            project_id: project.project_id,
            value: rating.value,
            image_name: rating.image_name,
          })
        )
      );
      setQueuedRatings([]);
      setCreatedProjects((projects) => {
        const updatedProjects = [...projects];
        updatedProjects[folderIndex] = project;
        return updatedProjects;
      });
    } catch {}
  };

  const handleAddProjectFiles = async (folder: Folder, folderIndex = 0) => {
    const uploadFolder = folder || currentFolder;
    if (!uploadFolder || !project) return;
    try {
      const imageFiles = uploadFolder.images.map((img) => img.file);
      const tempFileLocations = await uploadFiles(imageFiles);
      await addProjectFiles({
        projectId: project?.project_id,
        file_locations: tempFileLocations,
      });

      await getProject(currentProject.project_id);
    } catch {}
  };

  const handleImageClick = useCallback((imageIndex: number) => {
    setCarouselStartIndex(imageIndex);
    setIsCarouselOpen(true);
  }, []);

  const handleRatingChange = useCallback(
    async (imageName: string, value: number, ratingId?: string) => {
      const rating = new Rating();
      rating.image_name = imageName;
      rating.value = value;
      rating.rating_id = ratingId;

      if (!currentProject) {
        setQueuedRatings((queued) => {
          const existingIndex = queued.findIndex(
            (r) => r.image_name === rating.image_name
          );

          if (existingIndex !== -1) {
            // Update existing rating
            const updated = [...queued];
            updated[existingIndex] = rating;
            return updated;
          }

          // Add new rating if not found
          return [...queued, rating];
        });
        return;
      }
      if (!ratingId)
        return await createRating({
          project_id: currentProject.project_id,
          image_name: rating.image_name,
          value: rating.value,
        });
      return await updateRating({ ratingId, value });
    },
    [currentProject]
  );

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

  const handleImageHoverChange = useCallback(
    (isHovering: boolean) => setIsAnyImageHovered(isHovering),
    []
  );

  useEffect(() => {
    gradientSize.set(isAnyImageHovered ? 400 : 250);
    gradientOpacity.set(isAnyImageHovered ? 0.2 : 0.05);
  }, [isAnyImageHovered, gradientSize, gradientOpacity]);

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

  if (authUrl.data && !user?.dropbox?.access_token) {
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
                          {currentFolder.images.length} image
                          {currentFolder.images.length !== 1 ? "s" : ""}
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
                              <Share2 className="h-4 w-4" /> Share Folder
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

                      <PinterestGrid
                        projectId={project?.project_id || ""}
                        images={currentFolder.images}
                        ratings={[...queuedRatings, ...ratings]}
                        onImageClick={handleImageClick}
                        onRatingChange={handleRatingChange}
                        onImageHoverChange={handleImageHoverChange}
                      />
                    </div>

                    <ImageCarousel
                      images={currentFolder.images}
                      initialIndex={carouselStartIndex}
                      isOpen={isCarouselOpen}
                      onClose={handleCloseCarousel}
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

                  <FileUploader
                    onFilesSelected={handleNewFolders}
                    accept={{ "image/*": [] }}
                    maxFiles={1000}
                    directory={true}
                    className="h-dvh w-screen max-w-full max-h-full flex items-center justify-center"
                  >
                    <div className="text-center space-y-4">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          Upload Image Folders
                        </h3>
                        <p className="text-muted-foreground">
                          Drag and drop folders containing images, or click to
                          browse
                        </p>
                      </div>
                    </div>
                    <Button className="m-4">
                      <UploadIcon />
                      Upload
                    </Button>
                  </FileUploader>
                </>
              );
          }
        })()}
      </motion.div>
    </>
  );
}
