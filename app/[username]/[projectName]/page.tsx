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
import { v4 } from "uuid";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { b64ToFile, createImageFile } from "@/lib/utils/file-utils";
import { useAuth } from "@/hooks/api/useAuth";
import { Download } from "lucide-react";

export default function PublicProjectPage() {
  const { username, projectName } = useParams<{
    username: string;
    projectName: string;
  }>();
  const { user } = useAuth();

  const isCurrentUser = user?.username === username;

  const { toast } = useToast();
  const { show, hide } = useDialog();

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<
    (ImageFile & { preview_url?: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const { getProjectByShareUrl } = useProjects();
  const {
    ratings,
    getRatings: { mutateAsync: getRatings },
    createRating: { mutateAsync: createRating },
    updateRating: { mutateAsync: updateRating },
  } = useRatings();

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
          }; // real File object;
        })
      );

      // Load ratings for the project
      if (data.project?.project_id) {
        await getRatings(data.project.project_id);
      }

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
    try {
      setIsLoading(true);
      await loadProject(email);
    } catch (e) {}
  };

  const handleRatingChange = useCallback(
    async (imageName: string, value: number, ratingId?: string) => {
      if (!project) return;

      if (!ratingId) {
        const newRating = await createRating({
          project_id: project.project_id,
          image_name: imageName,
          value,
        });
        return newRating;
      } else {
        const updated = await updateRating({
          ratingId,
          value,
        });
        return updated;
      }
    },
    [project, createRating, updateRating, toast]
  );

  const handleDownload = async () => {
    if (!project || images.length === 0) return;

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
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>

              {project.can_download && (
                <Button
                  onClick={handleDownload}
                  className="mt-4"
                  variant="default"
                >
                  Download
                  <Download />
                </Button>
              )}
            </div>

            <PinterestGrid
              ratingDisabled={!project}
              images={images}
              ratings={ratings}
              onImageClick={(i) => {
                setCarouselStartIndex(i);
                setIsCarouselOpen(true);
              }}
              onRatingChange={handleRatingChange}
              onImageHoverChange={(hovering) => setIsHovered(hovering)}
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
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!trimmed) {
      setError("Email is required");
      return;
    }

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
