"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Info, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EXIFData, MediaFile } from "@/types";
import { Rating } from "@/lib/api/ratingsApi";
import StarRatingWithAvatars from "./star-rating-slider";
import { useAuth } from "@/hooks/api/useAuth";
import { LOCAL_RATINGS_STORAGE_KEY, useRatings } from "@/hooks/api/useRatings";
import { Project } from "@/types/project";
import { useMetadata } from "@/hooks/api/useMetadata";
import { getLocalStorage } from "@/lib/localStorage";
import { staggeredContainerVariants } from "@/lib/motion";
import { NotesModal } from "./notes-modal";
import { useModal } from "@/hooks/use-modal";
import { isImageFile } from "@/lib/utils/file-utils";
import { VideoPlayer } from "./video-player";

const MOBILE_HEIGHT = "80vh"

interface MediaCarouselProps {
  project: Project
  media: (MediaFile & { preview_url?: string })[];
  ratings: Rating[]
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onRatingChange?: (mediaName: string, value: number, ratingId?: string) => void;

}

export function MediaCarousel({
  project,
  media,
  ratings,
  initialIndex,
  isOpen,
  onClose,
  onRatingChange
}: MediaCarouselProps) {
  const modal = useModal()
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLoading(true);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLoading(true);
    }
  }, [currentIndex, media.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
      }
    },
    [isOpen, onClose, handlePrevious, handleNext]
  );

  const handleShowNotes = useCallback(() => {
    if (!currentMedia) return

    modal.show({
      title: `Notes`,
      content: () => (
        <NotesModal projectId={project.project_id} mediaName={currentMedia.name} />
      ),
      height: "400px",
      width: "500px",
    });
  }, []);

  const handleShowInfo = useCallback(() => {
    setShowInfo((prev) => !prev); // toggle info panel
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    else if (isRightSwipe) handlePrevious();
  };

  const isMobile = typeof window !== "undefined"
    ? window.matchMedia("(max-width: 768px)").matches
    : false;

  const currentMedia = media[currentIndex];

  const imageRatings = ratings.filter((rating) => rating.media_name === currentMedia.name)

  const handleRatingChange = useCallback(
    (mediaName: string, value: number, ratingId?: string) => {
      onRatingChange?.(mediaName, value, ratingId);
    },
    [onRatingChange]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          initial={{ opacity: 0, filter: "blur(20px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{
            opacity: { duration: 0.3 },
            filter: { duration: 0.5 },
          }}
        >
          <div className="h-full flex flex-col md:flex-row">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="text-white">
                <h3 className="font-semibold">{currentMedia?.name}</h3>
                <p className="text-sm text-white/70">
                  {currentIndex + 1} of {media.length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShowNotes}
                  className="text-white hover:bg-white/20"
                >
                  <MessageSquareText className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShowInfo}
                  className="text-white hover:bg-white/20"
                >
                  <Info className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Main carousel */}
            <div
              ref={carouselRef}
              className="relative flex flex-1 items-center justify-center h-full p-4 pt-20 pb-20"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Previous button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              {/* Media container */}
              {isImageFile(currentMedia.file) ?
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <div className="relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                    <Image
                      src={currentMedia?.preview_url || "/placeholder.svg"}
                      alt={currentMedia?.name || "Image"}
                      width={1200}
                      height={800}
                      className={cn(
                        "max-w-full w-auto h-auto object-contain transition-opacity duration-300",
                        `max-h-${MOBILE_HEIGHT}`,
                        isLoading ? "opacity-0" : "opacity-100"
                      )}
                      onLoad={() => setIsLoading(false)}
                      priority
                    />
                  </div>
                </div>
                :
                (
                  <div className="relative max-w-full max-h-full flex items-center justify-center">
                    <div className="relative">
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        </div>
                      )}

                      <VideoPlayer
                        controls
                        playsInline
                        preload="metadata"
                        poster={currentMedia.thumbnail_url}
                        src={currentMedia.preview_url}
                        onLoadedData={() => setIsLoading(false)}
                      />
                    </div>
                  </div>
                )}

              {/* Next button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === media.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  className="h-dvh w-full backdrop-blur text-white p-4 overflow-y-auto border-l"
                  initial={
                    isMobile
                      ? { height: 0 }
                      : { width: 0 }
                  }
                  animate={
                    isMobile
                      ? { height: "60vh" }
                      : { width: "30vw" }
                  }
                  exit={
                    isMobile
                      ? { height: "60vh" }
                      : { width: 0 }
                  }
                  transition={{ duration: 0.3 }}
                >
                  <DetailsInfo
                    project={project}
                    media={currentMedia}
                    ratings={imageRatings}
                    onRatingChange={(value, ratingId) =>
                      handleRatingChange(currentMedia.name, value, ratingId)
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Bottom navigation dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/50 rounded-full px-4 py-2">
              {media.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsLoading(true);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    idx === currentIndex
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


function DetailsInfo({
  project,
  media,
  ratings,
  onRatingChange
}: {
  project: Project,
  media: MediaFile,
  ratings: Rating[],
  onRatingChange: (value: number, ratingId?: string) => void;
}) {
  const { user } = useAuth()
  const { getImageMetadata } = useMetadata()

  const { data: imageMetadata } = getImageMetadata(project.project_id, media.file)

  const metadata = media.metadata || imageMetadata?.exif_data

  const localRatings =
    project.project_id && (getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {})[project.project_id];

  const rating = (media: MediaFile) =>
    (ratings?.find(
      (r) => r.media_name === media.name && user?.user_id === r.user_id
    ) ??
      localRatings?.find((r: Rating) => r.media_name === media.name)) as Rating ||
    new Rating();

  const renderMetadata = () => {
    if (!metadata) return null;

    const labelMap: Record<string, string> = {
      Make: "Camera Make",
      Model: "Camera Model",
      Orientation: "Orientation",
      DateTime: "Date/Time",
      ISO: "ISO",
      ShutterSpeedValue: "Shutter Speed",
      FNumber: "F Number",
      ApertureValue: "Aperture Value",
      ExifMediaHeight: "Media Height",
      ExifMediaWeight: "Media Width",
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    return (
      <motion.div
        variants={staggeredContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {Object.keys(labelMap).map((key) => {
          const value = (metadata as EXIFData)[key as keyof EXIFData];
          if (value === undefined || value === null) return null;

          let displayValue: string | number | number[] | Date | Record<string, any> = value;

          if (value instanceof Date) {
            displayValue = value.toLocaleString();
          } else if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else if (typeof value === "object" && value !== null) {
            displayValue = JSON.stringify(value, null, 2);
          }

          return (
            <motion.div
              key={key}
              className="w-full flex justify-between break-all"
              variants={itemVariants}
            >
              <span className="text-muted-foreground text-sm">{labelMap[key]}</span>
              <span className="text-sm">{String(displayValue)}</span>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };


  return (
    <motion.div
      className="flex flex-col justify-center items-center h-full w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Metadata Display */}
      <div className={cn("w-90 md:max-w-[30vw] flex flex-col gap-2 p-4 overflow-scroll", `max-h-${MOBILE_HEIGHT}`)}>
        <div className="w-full flex justify-between break-all">
          <span className="text-muted-foreground">Rating</span>
          {/* Star Rating */}
          <div className="w-min">
            <StarRatingWithAvatars
              value={
                rating(media).value || 0
              }
              onRatingChange={(value) =>
                onRatingChange(
                  value,
                  rating(media).rating_id
                )
              }
            />
          </div>
        </div>

        {renderMetadata()}
      </div>
    </motion.div>
  )
}
