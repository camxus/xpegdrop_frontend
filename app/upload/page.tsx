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
import { useDialog } from "@/hooks/use-dialog"; // Import useDialog hook
import { useProjects } from "@/hooks/api/useProjects";
import { Project } from "@/types/project";

export default function FolderImageGallery() {
  const { toast } = useToast();
  const { show, hide } = useDialog(); // Declare useDialog hook

  const {
    createProject: {
      mutateAsync: createProject,
      isPending: isUploading,
      data: project,
    },
  } = useProjects();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderIndex, setCurrentFolderIndex] = useState(0);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const [createdProject, setCreatedProject] = useState<Project>();

  // Motion values for mouse position, default center 50%
  const x = useMotionValue(50);
  const y = useMotionValue(50);

  // Smooth animated spring following the mouse
  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  // Animate gradient size and opacity (handle hover effect)
  const [isAnyImageHovered, setIsAnyImageHovered] = useState(false);
  const gradientSize = useMotionValue(250); // Base size in px
  const gradientOpacity = useMotionValue(0.05); // Base opacity
  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, {
    stiffness: 150,
    damping: 30,
  });

  // Compose the gradient string from animated values
  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([latestX, latestY, latestSize, latestOpacity]) =>
      `radial-gradient(circle ${latestSize}px at ${latestX}% ${latestY}%, rgba(255,255,255,${latestOpacity}) 0%, rgba(255,255,255,${
        (latestOpacity as number) * 0.25
      }) 50%, transparent 100%)`
  );

  const currentFolder = folders[currentFolderIndex];

  const handleFolderUpload = useCallback(
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

      setFolders((prev) => [...prev, ...newFolders]);
      setCurrentFolderIndex(folders.length); // Navigate to first new folder

      toast({
        title: "Folders Uploaded",
        description: `Successfully uploaded ${newFolders.length} folder(s) with images.`,
      });
    },
    [folders.length, toast]
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

  const handlePreviousFolder = () => {
    setCurrentFolderIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextFolder = () => {
    setCurrentFolderIndex((prev) => Math.min(folders.length - 1, prev + 1));
  };

  const handleUploadToDropbox = async () => {
    if (!currentFolder) return;

    try {
      const imageFiles = currentFolder.images.map((img) => img.file);
      await createProject({
        name: currentFolder.name,
        files: imageFiles,
      });
    } catch {
    }
  };

  const handleImageClick = useCallback((imageIndex: number) => {
    setCarouselStartIndex(imageIndex);
    setIsCarouselOpen(true);
  }, []);

  const handleCloseCarousel = useCallback(() => {
    setIsCarouselOpen(false);
  }, []);

  const handleShare = () => {
    if (!currentFolder || !project) return;

    show({
      content: () => <ShareDialog project={project} onClose={hide} />,
    });
  };

  // Global mousemove updates motion values directly
  const handleGlobalMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      x.set(xPercent);
      y.set(yPercent);
    },
    [x, y]
  );

  // Handle image hover change for background gradient intensity and size
  const handleImageHoverChange = useCallback((isHovering: boolean) => {
    setIsAnyImageHovered(isHovering);
  }, []);

  // Animate gradient size and opacity on image hover state change
  useEffect(() => {
    if (isAnyImageHovered) {
      gradientSize.set(400); // Larger size for "shine up"
      gradientOpacity.set(0.2); // Higher opacity for "shine up"
    } else {
      gradientSize.set(250); // Revert to base size
      gradientOpacity.set(0.05); // Revert to base opacity
    }
  }, [isAnyImageHovered, gradientSize, gradientOpacity]);

  return (
    <motion.div // Use motion.div for Framer Motion animations
      className={cn("min-h-screen bg-background relative overflow-hidden")}
      onMouseMove={handleGlobalMouseMove}
      style={{
        backgroundColor: "var(--background)",
        backgroundImage: gradient, // Use the transformed gradient motion value
        backgroundAttachment: "fixed",
        backgroundPosition: `${springX.get()}% ${springY.get()}%`, // Use spring values for position
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        // Framer Motion handles transitions, so no explicit CSS transition needed here
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {currentFolder ? (
            <div className="space-y-4">
              <EditableTitle
                title={currentFolder.name}
                onSave={handleFolderRename}
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

        {/* Main Content */}
        {currentFolder ? (
          <div className="mb-20">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {currentFolder.images.length} image
                {currentFolder.images.length !== 1 ? "s" : ""}
              </p>
              <Button
                onClick={
                  !project?.share_url ? handleShare : handleUploadToDropbox
                }
                disabled={isUploading}
                className="cursor-pointer flex items-center gap-2"
              >
                {!project?.share_url ? (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share Folder
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload to Dropbox"}
                  </>
                )}
              </Button>
            </div>
            <PinterestGrid
              images={currentFolder.images}
              onImageClick={handleImageClick}
              onImageHoverChange={handleImageHoverChange}
            />
          </div>
        ) : (
          <div className="mb-20">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <FileUploader
                  onFilesSelected={handleFolderUpload}
                  accept={{ "image/*": [] }}
                  maxFiles={1000}
                  directory={true} // Enable multiple folder upload
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

        {/* Image Carousel */}
        {currentFolder && (
          <ImageCarousel
            images={currentFolder.images}
            initialIndex={carouselStartIndex}
            isOpen={isCarouselOpen}
            onClose={handleCloseCarousel}
          />
        )}

        {/* Fixed Upload Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
          <div className="container mx-auto">
            <FileUploader
              onFilesSelected={handleFolderUpload}
              accept={{ "image/*": [] }}
              maxFiles={1000}
              directory={true} // Enable multiple folder upload
              className="h-16"
            >
              <div className="flex items-center justify-center gap-2 text-sm">
                <Upload className="h-4 w-4" />
                Drop folders here to upload more images
              </div>
            </FileUploader>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
