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
import { b64ToFile, createImageFile } from "@/lib/utils/file-utils";
import { useAuth } from "@/hooks/api/useAuth";
import axios from "axios";
import { EditableTitle } from "@/components/editable-title";
import { ShareDialog } from "@/components/share-dialog";
import { Download, Share2 } from "lucide-react";
import { Rating } from "@/lib/api/ratingsApi";
import { ImagesFilter } from "@/components/images-filter";

export default function PublicProjectPage() {
  const { username, projectName } = useParams<{
    username: string;
    projectName: string;
  }>();
  const { user } = useAuth();

  const isCurrentUser = user?.username === username;

  const { toast } = useToast();
  const { show, hide } = useDialog();

  const {
    getProjectByShareUrl,
    updateProject: { mutateAsync: updateProject },
  } = useProjects();
  const {
    ratings,
    foreignRatings,
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
  const [filteredRatings, setFilteredRatings] =
    useState<Rating[]>(foreignRatings);

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
      setImages(
        data.images.map((i: { preview_url: string; thumbnail_url: string }) => {
          const thumbnailFile = b64ToFile(i.thumbnail_url);

          return {
            ...createImageFile(thumbnailFile, projectName),
            preview_url: i.preview_url,
          };
        })
      );
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
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");
    const zip = new JSZip();
    const folder = zip.folder(project.name) || zip;

    const fetchPromises = images.map(async (img, index) => {
      try {
        if (!img.preview_url) return;
        const response = await axios.get(img.preview_url, {
          responseType: "blob",
        });
        folder.file(`${img.name}`, response?.data);
      } catch (err) {
        console.error(`Failed to fetch ${img.url}`, err);
      }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${project.name}.zip`);
  };

  const handleUpdateProject = async (newName: string) => {
    if (!project || !isCurrentUser) return;
    try {
      const updated = await updateProject({
        projectId: project.project_id,
        data: { name: newName },
      });
      setProject({ ...project, ...updated });
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (!project) return;
    show({
      content: () => <ShareDialog project={project} onClose={hide} />,
    });
  };

  const hanldeFilterChange = ({
    userIds,
    ratingValues,
  }: {
    userIds: string[];
    ratingValues: number[];
  }) => {
    const filteredRatings = Object.values(ratings).filter((r) => {
      const userMatch = userIds.length === 0 || userIds.includes(r.user_id);
      const ratingMatch =
        ratingValues.length === 0 || ratingValues.includes(r.value);
      return userMatch && ratingMatch;
    });

    setFilteredRatings(filteredRatings);

    // Step 2: Filter images based on the filtered ratings
    setFilteredImages(
      images.filter((image) =>
        filteredRatings.some((rating) => rating.image_name === image.name)
      )
    );
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
            <div className="mb-6 flex items-center justify-between">
              <div className="mb-6 space-y-2">
                <EditableTitle
                  title={project.name}
                  onSave={handleUpdateProject}
                  editable={isCurrentUser}
                />
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {(project.can_download || isCurrentUser) && (
                  <Button onClick={handleDownload}>
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
              onFilterChange={hanldeFilterChange}
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
            />
            <ImageCarousel
              images={images}
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
