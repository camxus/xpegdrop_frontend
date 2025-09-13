"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PinterestGrid } from "@/components/pinterest-grid";
import { ImageCarousel } from "@/components/image-carousel";
import { useProjects } from "@/hooks/api/useProjects";
import { useRatings } from "@/hooks/api/useRatings";
import { useToast } from "@/hooks/use-toast";
import { useDialog } from "@/hooks/use-dialog";
import type { ImageFile } from "@/types";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/project";
import { ApiError } from "@/lib/api/client";
import { b64ToFile, createImageFile, urlToFile } from "@/lib/utils/file-utils";
import { useAuth } from "@/hooks/api/useAuth";
import axios from "axios";
import { EditableTitle } from "@/components/editable-title";
import { ShareDialog } from "@/components/share-dialog";
import { Download, Share2 } from "lucide-react";
import { Rating } from "@/lib/api/ratingsApi";
import { ImagesFilter } from "@/components/images-filter";
import { BATCH_SIZE, useS3 } from "@/hooks/api/useS3";
import { S3Location } from "@/types/user";
import { useDownload } from "@/hooks/useDownload";

export default function PublicProjectPage() {
  const { username, projectName } = useParams<{
    username: string;
    projectName: string;
  }>();
  
  const { user } = useAuth();

  const isCurrentUser = user?.username === username;

  const { toast } = useToast();
  const { show, hide } = useDialog();

  const { uploadFile } = useS3();
  const { downloadFiles, isDownloading } = useDownload();

  const {
    getProjectByShareUrl,
    updateProject: { mutateAsync: updateProject },
    addProjectFiles: { mutateAsync: addProjectFiles },
    getProject: { mutateAsync: getProject },
  } = useProjects();

  const {
    ratings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    updateRating: { mutateAsync: updateRating },
  } = useRatings();

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<
    (ImageFile & { preview_url?: string })[]
  >([]);
  const [filteredImages, setFilteredImages] = useState<
    (ImageFile & { preview_url?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

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
    ([x, y, size, opacity]) =>
      `radial-gradient(circle ${size}px at ${x}% ${y}%, rgba(255,255,255,${opacity}) 0%, rgba(255,255,255,${
        (opacity as number) * 0.25
      }) 50%, transparent 100%)`
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
      const data = await getProjectByShareUrl(username, projectName, email);
      setProject(data?.project || null);

      function createEmptyImage(
        name: string | undefined,
        folder: string,
        url?: string
      ): ImageFile & { preview_url: string } {
        return {
          id: `${folder}-${name || "empty"}-${Date.now()}`,
          name: name || "empty",
          url: url || "", // no blob URL yet
          file: new File([], name || "empty"), // empty File placeholder
          folder,
          preview_url: "", // will be replaced later
        };
      }

      async function processImagesInBatches(images: typeof data.images) {
        // 1. create placeholder array with same length
        const placeholders = images.map(
          (img: { name: string | undefined; thumbnail_url: string }) =>
            createEmptyImage(img.name, projectName, img.thumbnail_url)
        );

        // set placeholders immediately so UI knows number of slots
        setImages(placeholders);
        setFilteredImages(placeholders);

        // 2. progressively fill them batch by batch
        const result: (ImageFile & { preview_url: string })[] = [
          ...placeholders,
        ];

        for (let i = 0; i < images.length; i += BATCH_SIZE) {
          const batch = images.slice(i, i + BATCH_SIZE);

          const processedBatch = await Promise.all(
            batch.map(
              async (img: {
                thumbnail_url: string;
                name: string | undefined;
                preview_url: any;
              }) => {
                const thumbnailFile = await urlToFile(
                  img.thumbnail_url,
                  img.name
                );
                return {
                  ...createImageFile(thumbnailFile, projectName),
                  preview_url: img.preview_url,
                };
              }
            )
          );

          // replace the placeholders at the correct indices
          processedBatch.forEach((processed, index) => {
            result[i + index] = processed;
          });
        }

        return result;
      }

      // usage
      const result = await processImagesInBatches(data.images);

      setImages([...result]);
      setFilteredImages([...result]);
      setIsLoading(false);

      if (data.project?.project_id) await getRatings(data.project.project_id);
      hide();
    } catch (error: any) {
      const status = (error as ApiError)?.status;
      const reason = (error as ApiError)?.message;

      if (status === 400 && reason === "EMAIL_REQUIRED") {
        show({
          content: () => <EmailProtectedDialog onSubmit={handleEmailSubmit} />,
          actions: () => <></>,
        });
      } else if (status === 403 && reason === "EMAIL_INVALID") {
        toast({
          title: "Access denied",
          description:
            "The provided email is not approved to view this project.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading project",
          description: "Could not fetch project or images",
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

  const handleRatingChange = useCallback(
    async (imageName: string, value: number, ratingId?: string) => {
      if (!project) return;
      if (!ratingId)
        return await createRating({
          project_id: project.project_id,
          image_name: imageName,
          value,
        });
      return await updateRating({ ratingId, value });
    },
    [project, createRating, updateRating]
  );

  const handleDownload = async () => {
    if (!project || images.length === 0) return;

    downloadFiles(
      images.map((image) => ({
        name: image.name,
        url: image.preview_url || "",
      })),
      `${project.name}.zip`
    );
  };

  const handleUpdateProject = async (value: Partial<Project>) => {
    if (!project || !isCurrentUser) return;
    try {
      setProject({ ...project, ...value });
      await updateProject({
        projectId: project.project_id,
        data: value,
      });

      const updated = await getProject(project.project_id);
      setProject({ ...project, ...updated });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/${username}/${updated.name}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (!project) return;
    if (!isCurrentUser) return;
    show({
      content: () => <ShareDialog project={project} onClose={hide} />,
    });
  };

  const handleFilterChange = useCallback(
    ({
      userIds,
      ratingValues,
    }: {
      userIds: string[];
      ratingValues: number[];
    }) => {
      const isFiltering = !!userIds.length || !!ratingValues.length;

      if (!isFiltering) {
        setFilteredImages(images);
        return;
      }

      const filteredRatings = Object.values(ratings).filter(
        ({ user_id, value }) => {
          const userMatch = userIds.length ? userIds.includes(user_id) : true;
          const ratingMatch = ratingValues.length
            ? ratingValues.includes(value)
            : true;

          return userMatch && ratingMatch;
        }
      );

      const filteredImages = images.filter((image) =>
        filteredRatings.some((rating) => rating.image_name === image.name)
      );

      setFilteredImages(filteredImages);
    },
    [images, ratings] // deps
  );

  const handleDuplicateImage = async (image: ImageFile) => {
    if (!isCurrentUser || !project) return;

    const existingImage = images.find((i) => i.name === image.name);
    if (!existingImage?.preview_url) return;

    try {
      const response = await axios.get(existingImage.preview_url, {
        responseType: "blob",
      });
      const blob = response.data as Blob;
      const file = new File([blob], image.name, { type: blob.type });

      const location = (await uploadFile(file)) as S3Location;

      // 2. Use the addProjectFiles mutation to re-upload
      await addProjectFiles({
        projectId: project.project_id,
        file_locations: [location],
      });

      toast({
        title: "Image duplicated",
        description: `${image.name} has been added again.`,
      });

      loadProject();
    } catch (err: any) {
      console.error("Failed to duplicate image:", err);
      toast({
        title: "Error",
        description: "Could not duplicate image.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProject();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
        ) : project ? (
          <>
            <div className="mb-6 block md:flex items-center justify-between">
              <div className="mb-6 space-y-2">
                <EditableTitle
                  title={project.name}
                  onSave={(value) => handleUpdateProject({ name: value })}
                  editable={isCurrentUser}
                />
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 md:ml-0 ml-auto w-fit">
                {(project.can_download || isCurrentUser) && (
                  <Button disabled={isDownloading} onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
                {project.share_url && isCurrentUser && (
                  <Button
                    onClick={handleShare}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                )}
              </div>
            </div>

            <ImagesFilter
              ratings={ratings}
              onFilterChange={handleFilterChange}
            />

            <PinterestGrid
              ratingDisabled={!project}
              images={filteredImages}
              ratings={ratings}
              onImageClick={(i) => {
                setCarouselStartIndex(i);
                setIsCarouselOpen(true);
              }}
              onRatingChange={handleRatingChange}
              onImageHoverChange={(hover) => setIsHovered(hover)}
              onDuplicateImage={handleDuplicateImage}
            />
            <ImageCarousel
              images={filteredImages}
              initialIndex={carouselStartIndex}
              isOpen={isCarouselOpen}
              onClose={() => setIsCarouselOpen(false)}
            />
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Project not found
          </div>
        )}
      </div>
    </motion.div>
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
