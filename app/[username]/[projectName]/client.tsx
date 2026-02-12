"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { MediaMasonry } from "@/components/media-masonry";
import { MediaCarousel } from "@/components/media-carousel";
import { useProjects } from "@/hooks/api/useProjects";
import { useRatings } from "@/hooks/api/useRatings";
import { useToast } from "@/hooks/use-toast";
import { useDialog } from "@/hooks/use-dialog";
import type { EXIFData, Folder, MediaFile, StorageProvider } from "@/types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/project";
import { ApiError } from "@/lib/api/client";
import { b64ToFile, createMediaFile, urlToFile } from "@/lib/utils/file-utils";
import { useAuth } from "@/hooks/api/useAuth";
import axios from "axios";
import { EditableTitle } from "@/components/editable-title";
import { ShareDialog } from "@/components/share-dialog";
import { Download, History, MoreHorizontal, MoreVertical, Plus, Share2 } from "lucide-react";
import { Rating } from "@/lib/api/ratingsApi";
import { MediaFilter } from "@/components/media-filter";
import { BATCH_SIZE, useS3 } from "@/hooks/api/useS3";
import { S3Location } from "@/types/user";
import { useDownload } from "@/hooks/useDownload";
import { Progress } from "@/components/ui/progress";
import { GlobalFileUploader } from "@/components/global-file-uploader";
import {
  FolderPreviewActions,
  FolderPreviewContent,
} from "@/components/folder-preview-dialog";
import { useNotes } from "@/hooks/api/useNotes";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useUser } from "@/hooks/api/useUser";
import { useTenants } from "@/components/tenants-provider";
import UpgradePage from "@/app/upgrade/page";
import { useStorage } from "@/hooks/api/useStorage";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMetadata } from "@/hooks/api/useMetadata";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileUploaderRef } from "@/components/ui/file-uploader";
import HistoryModal from "@/components/history-modal";
import { useModal } from "@/hooks/use-modal";

interface IPublicProjectPage {
  tenantHandle: string | null
}

export default function PublicProjectPage({ tenantHandle }: IPublicProjectPage) {
  useServiceWorker();
  const { username, projectName } = useParams<{
    username: string;
    projectName: string;
  }>();

  const { user } = useAuth();

  const { toast } = useToast();
  const modal = useModal();
  const { show, hide } = useDialog();

  const { uploadFile } = useS3();
  const { downloadFiles, isDownloading, downloadFolderPDF } = useDownload();

  const {
    projectNotes,
    getProjectNotes: { mutateAsync: getProjectNotes },
  } = useNotes();

  const {
    getProjectByShareUrl,
    getTenantProjectByShareUrl,
    updateProject: { mutateAsync: updateProject },
    addProjectFiles: { mutateAsync: addProjectFiles },
    removeProjectFile: { mutateAsync: removeProjectFile },
    getProject: { mutateAsync: getProject },
  } = useProjects();

  const {
    ratings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    updateRating: { mutateAsync: updateRating },
    handleRatingChange
  } = useRatings();

  const {
    getUserByUsername: { data: projectUser, mutateAsync: getUserByUsername },
  } = useUser();

  const {
    stats: { data: storageStats },
  } = useStorage();

  const { getProjectMetadata, batchCreateImageMetadata: { mutateAsync: batchCreateImageMetadata } } = useMetadata()

  const { getTenant } = useTenants()

  const { uploadFiles, isUploading: isUploadingToS3 } = useS3();

  const [project, setProject] = useState<Project | null>(null);
  const [media, setMedia] = useState<
    (MediaFile & { preview_url: string, full_file_url: string })[]
  >([]);
  const [selectedMedia, setSelectedMedia] = useState<Set<MediaFile["id"]>>(new Set());
  const [filteredMedia, setFilteredMedia] = useState<
    (MediaFile & { preview_url: string, full_file_url: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const [projectLoadProgress, setProjectLoadProgress] = useState(0);

  const { data: tenant } = getTenant(project?.tenant_id || "")
  const { data: projectMetadata = [] } = getProjectMetadata(project?.project_id || "")

  const uploaderRef = useRef<FileUploaderRef>(null);

  const isProjectUser = user?.user_id === projectUser?.user_id
  const isTenantMember = tenant?.members.some((m) => m.user_id === user?.user_id)
  const canEdit = isProjectUser ||
    project?.approved_users.some((u) => u.role == "editor") ||
    project?.approved_tenant_users.some((u) => (u.role === "admin" || u.role === "editor")) ||
    tenant?.members.some((m) => m.user_id === user?.user_id && (m.role === "admin" || m.role === "editor"))

  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const gradientSize = useMotionValue(250);
  const gradientOpacity = useMotionValue(0.05);
  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });
  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, {
    stiffness: 150,
    damping: 30,
  });
  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([xVal, yVal, size, opacity]) =>
      `radial-gradient(circle ${size}px at ${xVal}% ${yVal}%, 
      rgba(var(--foreground-rgb), ${opacity}) 0%, 
      rgba(var(--foreground-rgb), ${opacity as number * 0.25}) 50%, 
      transparent 100%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width) * 100);
    y.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  useEffect(() => {
    gradientSize.set(isHovered ? 400 : 250);
    gradientOpacity.set(isHovered ? 0.2 : 0.05);
  }, [isHovered]);

  const loadProject = async (email?: string) => {
    try {
      const data = tenantHandle ? await getTenantProjectByShareUrl(tenantHandle, username, projectName, email) : await getProjectByShareUrl(username, projectName, email);
      setProject(data.project || null);

      function createEmptyMedia(
        name: string | undefined,
        folder: string,
        type?: string,
        thumbnailUrl?: string,
        previewUrl?: string,
        fullFileUrl?: string
      ): MediaFile & { preview_url: string, full_file_url: string } {
        return {
          id: `${folder}-${name || "empty"}-${Date.now()}`,
          name: name || "empty",
          type: type || "",
          thumbnail_url: thumbnailUrl || "", // no blob URL yet
          file: new File([], name || "empty"), // empty File placeholder
          folder,
          preview_url: previewUrl || "", // will be replaced later
          full_file_url: fullFileUrl || "", // will be replaced later
          metadata: null
        };
      }

      async function processMediaInBatches(media: typeof data.media) {
        // 1. create placeholder array with same length
        const placeholders = media.map(
          (m: { name?: string | undefined; type?: string, thumbnail_url?: string, preview_url?: string, full_file_url?: string }) =>
            createEmptyMedia(m.name, projectName, m.type, m.thumbnail_url, m.preview_url, m.full_file_url)
        );

        setMedia(placeholders);
        setFilteredMedia(placeholders);

        // 2. progressively fill them batch by batch
        const result: (MediaFile & { preview_url: string, full_file_url: string })[] = [
          ...placeholders,
        ];

        let processedCount = 0;

        for (let i = 0; i < media.length; i += BATCH_SIZE) {
          const batch = media.slice(i, i + BATCH_SIZE);

          const processedBatch = await Promise.all(
            batch.map(async (m) => {
              // Decide which URL to convert into a File
              const fileUrl = m.type.includes("video") ? m.preview_url : m.thumbnail_url || "";

              const mediaFile = await urlToFile(fileUrl, m.name);

              return {
                ...(await createMediaFile(mediaFile, projectName)),
                thumbnail_url: m.thumbnail_url,
                preview_url: m.preview_url,
                full_file_url: m.full_file_url
              };
            })
          );

          // replace the placeholders at the correct indices
          processedBatch.forEach((processed, index) => {
            result[i + index] = processed;
            processedCount++;
          });

          // update progress based on processed items
          setProjectLoadProgress((processedCount / placeholders.length) * 100);
        }

        return result;
      }

      // usage
      const result = await processMediaInBatches(data.media);

      setMedia([...result]);
      setFilteredMedia([...result]);
      setIsLoading(false);

      if (data.project?.project_id) await getRatings(data.project.project_id);
      hide();
    } catch (error: any) {
      const status = (error as ApiError)?.status;
      const message = (error as ApiError)?.message;

      if (status === 400 && message === "EMAIL_REQUIRED") {
        show({
          content: () => <EmailProtectedDialog onSubmit={handleEmailSubmit} />,
          actions: () => <></>,
        });
      } else if (status === 403 && message === "EMAIL_INVALID") {
        toast({
          title: "Access denied",
          description:
            "The provided email is not approved to view this project.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading project",
          description: "Could not fetch project or media",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    setIsLoading(true);
    await loadProject(email);
  };

  const handleDownloadAsZip = async () => {
    if (!project) return;

    const selected = selectedMedia.size > 0
      ? media.filter((m) => selectedMedia.has(m.id))
      : media;

    if (selected.length === 0) return;

    downloadFiles(
      selected.map((media) => {
        const url = new URL(media.full_file_url);
        url.searchParams.set('dl', '1'); // safely append dl=1
        return {
          name: media.name,
          url: url.toString(),
        };
      }),
      project.name
    );
  };

  const handleDownloadAsPDF = async () => {
    if (!project) return;

    const selected = selectedMedia.size > 0
      ? media.filter((m) => selectedMedia.has(m.id))
      : media;

    if (selected.length === 0) return;

    downloadFolderPDF(project,
      selected.map((media) => {
        const url = new URL(media.full_file_url);
        url.searchParams.set('dl', '1'); // safely append dl=1
        return {
          ...media,
          url: url.toString(),
        };
      }),
    );
  };

  const handleUpdateProject = async (value: Partial<Project>) => {
    if (!project || !isProjectUser) return;
    try {
      setProject({ ...project, ...value });
      await updateProject({
        projectId: project.project_id,
        data: value,
      });

      const updated = await getProject(project.project_id);
      setProject({ ...project, ...updated });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", new URL(updated.share_url).pathname);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProjectFiles = async (folder: Folder, folderIndex = 0, storageProvider: StorageProvider) => {
    const uploadFolder = folder;
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

      setMedia((media) => [...media, ...uploadFolder.media.map((m) => ({ ...m, preview_url: m.thumbnail_url, full_file_url: m.thumbnail_url }))])

      await getProject(project.project_id);
    } catch { }
  };

  const handleAddNewFolders = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        toast({
          title: "No Media Found",
          description: "Please upload folders containing media files.",
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
              folderFiles.map(
                async (file) => await createMediaFile(file, folderName)
              )
            ),
            createdAt: new Date(),
          })
        )
      );

      show({
        title: "Add Files",
        content: FolderPreviewContent,
        contentProps: {
          editable: false,
          folders: folderArray,
          onCancel: hide,
          onUpload: async (
            confirmedFolders: Folder[],
            currentFolderIndex: number,
            storageProvider: StorageProvider
          ) => {

            const provider = project?.b2_folder_path
              ? "b2"
              : project?.dropbox_folder_path
                ? "dropbox"
                : project?.google_folder_id
                  ? "google"
                  : storageProvider;

            Promise.all(
              confirmedFolders.map(
                async (folder) => {
                  await handleAddProjectFiles(folder, currentFolderIndex, provider)
                }
              )
            );
            hide();
          },
        },
        actions: (props) => FolderPreviewActions({ ...props, isNewUpload: false }),
      });
    },
    [project]
  );

  const handleShowHistory = () => {
    if (!project) return;
    if (!isProjectUser && !isTenantMember) return;
    modal.show({
      title: "Project History",
      content: () => <HistoryModal projectId={project.project_id} />,
    });
  };

  const handleShare = () => {
    if (!project) return;
    if (!isProjectUser && !isTenantMember) return;
    show({
      content: () => <ShareDialog project={project} onClose={hide} />,
    });
  };

  const handleFilterChange = useCallback(
    ({
      uploadedByUserIds,
      ratedByUserIds,
      ratingValues,
    }: {
      uploadedByUserIds: string[]
      ratedByUserIds: string[];
      ratingValues: number[];
    }) => {
      const isFiltering = !!uploadedByUserIds.length || !!ratedByUserIds.length || !!ratingValues.length;

      if (!isFiltering) {
        setFilteredMedia(media);
        return;
      }

      const filteredRatings = Object.values(ratings).filter(
        ({ user_id, value }) => {
          const uploadedByUserMatch = uploadedByUserIds.length ? uploadedByUserIds.includes(user_id) : true;
          const ratedByUserMatch = ratedByUserIds.length ? ratedByUserIds.includes(user_id) : true;
          const ratingMatch = ratingValues.length ? ratingValues.includes(value) : true;

          return uploadedByUserMatch && ratedByUserMatch && ratingMatch;
        }
      );

      const filteredMedia = media.filter((media) =>
        filteredRatings.some((rating) => rating.media_name === media.name)
      );

      setFilteredMedia(filteredMedia);
    },
    [media, ratings] // deps
  );

  const handleDuplicateMedia = async (mediaFile: MediaFile) => {
    if (!isProjectUser || !project) return;

    const existingMedia = media.find((i) => i.name === mediaFile.name);
    if (!existingMedia?.preview_url) return;

    try {
      const response = await axios.get(existingMedia.preview_url, {
        responseType: "blob",
      });
      const blob = response.data as Blob;
      const file = new File([blob], mediaFile.name, { type: blob.type });

      const location = (await uploadFile(file)) as S3Location;

      // 2. Use the addProjectFiles mutation to re-upload
      await addProjectFiles({
        projectId: project.project_id,
        file_locations: [location],
      });

      if (existingMedia.metadata && !!Object.keys(existingMedia.metadata).length) {
        await batchCreateImageMetadata({
          project_id: project.project_id,
          file_metadata: { [existingMedia.name]: existingMedia.metadata },
        });
      }

      toast({
        title: "Media duplicated",
        description: `${mediaFile.name} has been added again.`,
      });

      loadProject();
    } catch (err: any) {
      console.error("Failed to duplicate media:", err);
      toast({
        title: "Error",
        description: "Could not duplicate media.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedia = async (mediaFile: MediaFile) => {
    if (!project?.project_id) return

    await removeProjectFile({ projectId: project?.project_id, fileName: mediaFile.name })
    loadProject()
  }

  useEffect(() => {
    loadProject();
    getUserByUsername(username);
  }, []);

  useEffect(() => {
    if (project) getProjectNotes(project.project_id);
  }, [project]);

  return (
    <>
      {canEdit &&
        <GlobalFileUploader
          ref={uploaderRef}
          onFilesSelected={handleAddNewFolders}
          directory={false}
        />
      }

      <motion.div
        className="min-h-dvh bg-background relative overflow-hidden"
        onMouseMove={handleMouseMove}
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: gradient,
          backgroundAttachment: "fixed",
          backgroundPosition: `${springX.get()}% ${springY.get()}%`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-[80vh]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-50"
              >
                <Progress
                  className="h-2"
                  value={projectLoadProgress}
                  color="bg-foreground"
                />
              </motion.div>
            </div>
          ) : project ? (
            <>
              <div className="mb-6 block md:flex items-center justify-between">
                <div className="mb-6 space-y-2">
                  <EditableTitle
                    title={project.name}
                    onSave={(value) => handleUpdateProject({ name: value })}
                    editable={canEdit}
                  />
                  <p className="text-sm font-light text-muted-foreground">
                    Created
                    {projectUser && (
                      <> by {isProjectUser ? "You" : projectUser.first_name}</>
                    )}{" "}
                    on {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  {project.description && (
                    <p className="text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 md:ml-0 ml-auto w-fit">
                  {(project.can_download || isProjectUser || isTenantMember) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button disabled={!selectedMedia}>
                          <Download className="h-4 w-4 mr-2" />
                          Download {!!selectedMedia?.size && "Selected"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDownloadAsZip}>
                          Download as ZIP
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadAsPDF}>
                          Download as PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {project.share_url && canEdit && (
                    <Button
                      onClick={handleShare}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                  )}
                  {/* <Button variant={"ghost"} onClick={handleShowHistory}>
                    <History />
                  </Button> */}
                  {canEdit && (
                    <div className="md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => uploaderRef.current?.open()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Files
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>

              <MediaFilter
                metadata={projectMetadata}
                ratings={ratings}
                onFilterChange={handleFilterChange}
              />

              <div className="flex items-center justify-end p-4 gap-2">
                <Checkbox
                  id="select-all"
                  className="cursor-pointer"
                  checked={
                    filteredMedia.length > 0 &&
                    selectedMedia.size === filteredMedia.length
                  }
                  onClick={(e) => {
                    setSelectedMedia((selected) =>
                      selected.size !== filteredMedia.length
                        ? new Set(filteredMedia.map((img) => img.id))
                        : new Set()
                    );
                  }}
                />
                <Label
                  htmlFor="select-all"
                  className={cn("cursor-pointer select-none transition-all", !!selectedMedia.size ? "text-foreground" : "text-muted-foreground")}
                >
                  Select All
                </Label>
              </div>

              <MediaMasonry
                projectId={project.project_id}
                projectNotes={projectNotes}
                ratingDisabled={!project}
                media={filteredMedia}
                metadata={projectMetadata}
                ratings={ratings}
                selectedMedia={selectedMedia}
                onMediaClick={(i) => {
                  setCarouselStartIndex(i);
                  setIsCarouselOpen(true);
                }}
                onRatingChange={(mediaName, value, ratingId) => handleRatingChange(mediaName, value, ratingId, project)}
                onMediaHoverChange={(hover) => setIsHovered(hover)}
                onDuplicateMedia={handleDuplicateMedia}
                onDeleteMedia={handleDeleteMedia}
                canEdit={canEdit}
                onSelectChange={setSelectedMedia}
              />
              <MediaCarousel
                project={project}
                ratings={ratings}
                media={filteredMedia}
                initialIndex={carouselStartIndex}
                isOpen={isCarouselOpen}
                onClose={() => setIsCarouselOpen(false)}
                onRatingChange={(mediaName, value, ratingId) => handleRatingChange(mediaName, value, ratingId, project)}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-[80vh]">
              <div className="text-center text-muted-foreground">
                Project not found
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

export function EmailProtectedDialog({
  onSubmit,
}: {
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Email is required");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This project is email-restricted. Please enter your email to continue.
      </p>
      <Input
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={handleSubmit} className="w-full">
        Submit
      </Button>
    </div>
  );
}
