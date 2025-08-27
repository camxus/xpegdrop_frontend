"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { PinterestGrid } from "@/components/pinterest-grid";
import { FolderNavigation } from "@/components/folder-navigation";
import { EditableTitle } from "@/components/editable-title";
import { useToast } from "@/hooks/use-toast";
import { processFolderUpload } from "@/lib/utils/file-utils";
import { Upload, FolderOpen, Share2 } from "lucide-react";
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

export default function FolderImageGallery() {
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
  } = useProjects();

  const {
    ratings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    updateRating: { mutateAsync: updateRating },
  } = useRatings();

  const isUploading = isUploadingProject || isUploadingToS3;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [queuedRatings, setQueuedRatings] = useState<
    { image_name: string; value: number }[]
  >([]);
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
  const currentProject = createdProjects.find(
    (p) => p.name === currentFolder?.name
  );

  const handleNewFolders = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const newFolders = processFolderUpload(files);
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
          onUpload: async (confirmedFolders: Folder[]) => {
            setFolders((prev) => [...prev, ...confirmedFolders]);
            setCurrentFolderIndex(confirmedFolders.length ? 0 : 0);
            Promise.all(
              confirmedFolders.map(
                async (folder) => await handleUploadToDropbox(folder)
              )
            );
            hide();
          },
        },
        actions: FolderPreviewActions,
      });
    },
    [toast, show, hide, project, isUploading]
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
        const updatedProject = await updateProject({
          projectId: currentProject.project_id,
          data: {
            name: newName,
          },
        });
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

  const handleUploadToDropbox = async (folder?: Folder) => {
    const uploadFolder = currentFolder || folder;
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
          createRating({ project_id: project.project_id, ...rating })
        )
      );
      setQueuedRatings([]);
      setCreatedProjects((projects) => [...projects, project]);
    } catch {}
  };

  const handleImageClick = useCallback((imageIndex: number) => {
    setCarouselStartIndex(imageIndex);
    setIsCarouselOpen(true);
  }, []);

  const handleRatingChange = useCallback(
    async (imageId: string, value: number, ratingId?: string) => {
      const rating = { image_name: imageId, value };
      if (!currentProject) {
        setQueuedRatings((queued) => [...queued, rating]);
        return;
      }
      if (!ratingId)
        return await createRating({
          project_id: currentProject.project_id,
          ...rating,
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

  return (
    <motion.div
      className={cn("min-h-screen bg-background relative overflow-hidden")}
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          {currentFolder ? (
            <div className="space-y-4">
              <EditableTitle
                title={currentFolder.name}
                onSave={
                  currentProject ? handleUpdateProject : handleFolderRename
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
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Folder Image Gallery</h1>
              <p className="text-muted-foreground">
                Upload folders to get started
              </p>
            </div>
          )}
        </div>

        {currentFolder ? (
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
                    : () => handleUploadToDropbox()
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
                    <Upload className="h-4 w-4" />{" "}
                    {isUploading ? "Uploading..." : "Upload to Dropbox"}
                  </>
                )}
              </Button>
            </div>
            <PinterestGrid
              images={currentFolder.images}
              ratings={ratings}
              onImageClick={handleImageClick}
              onRatingChange={handleRatingChange}
              onImageHoverChange={handleImageHoverChange}
            />
          </div>
        ) : (
          <div className="mb-20">
            <GlobalFileUploader
              onFilesSelected={handleNewFolders}
              directory={true}
            />
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <FileUploader
                  onFilesSelected={handleNewFolders}
                  accept={{ "image/*": [] }}
                  maxFiles={1000}
                  directory={true}
                  className="min-h-[200px]"
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
                </FileUploader>
              </CardContent>
            </Card>
          </div>
        )}

        {currentFolder && (
          <ImageCarousel
            images={currentFolder.images}
            initialIndex={carouselStartIndex}
            isOpen={isCarouselOpen}
            onClose={handleCloseCarousel}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="container mx-auto">
          <FileUploader
            onFilesSelected={handleNewFolders}
            accept={{ "image/*": [] }}
            maxFiles={1000}
            directory={true}
            className="h-16"
          >
            <div className="flex items-center justify-center gap-2 text-sm">
              <Upload className="h-4 w-4" /> Drop folders here to upload more
              images
            </div>
          </FileUploader>
        </div>
      </div>
    </motion.div>
  );
}
