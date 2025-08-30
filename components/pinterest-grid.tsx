"use client";

import { useState, memo, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/types";
import { StarRatingSlider } from "./star-rating-slider";
import { Rating } from "@/lib/api/ratingsApi";
import { useAuth } from "@/hooks/api/useAuth";
import { getLocalStorage } from "@/lib/localStorage";
import { LOCAL_RATINGS_STORAGE_KEY } from "@/hooks/api/useRatings";
import { motion } from "framer-motion";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuContent,
} from "./ui/context-menu";
import { EditImageView } from "./edit-image";

interface PinterestGridProps {
  ratingDisabled?: boolean;
  images: ImageFile[];
  ratings?: Rating[];
  className?: string;
  onImageClick?: (imageIndex: number) => void;
  onImageHoverChange?: (isHovering: boolean) => void;
  onRatingChange?: (imageId: string, value: number, ratingId?: string) => void;
}

export function PinterestGrid({
  ratingDisabled = false,
  images,
  ratings,
  className,
  onImageClick,
  onImageHoverChange,
  onRatingChange,
}: PinterestGridProps) {
  const { user } = useAuth();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages((prev) => {
      if (prev.has(imageId)) return prev;
      const newSet = new Set(prev);
      newSet.add(imageId);
      return newSet;
    });
  }, []);

  const handleMouseEnter = useCallback(
    (imageId: string) => {
      if (hoveredImage !== imageId) {
        setHoveredImage(imageId);
        onImageHoverChange?.(true);
      }
    },
    [hoveredImage, onImageHoverChange]
  );

  const handleMouseLeave = useCallback(() => {
    if (hoveredImage !== null) {
      setHoveredImage(null);
      onImageHoverChange?.(false);
    }
  }, [hoveredImage, onImageHoverChange]);

  const handleImageClick = useCallback(
    (imageIndex: number) => {
      onImageClick?.(imageIndex);
    },
    [onImageClick]
  );

  const handleRatingChange = useCallback(
    (imageName: string, value: number, ratingId?: string) => {
      onRatingChange?.(imageName, value, ratingId);
    },
    [onRatingChange]
  );

  const localRatings =
    ratings?.[0]?.project_id &&
    (getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {})[ratings?.[0].project_id];

  const rating = (image: ImageFile) =>
    (ratings?.find(
      (r) => r.image_name === image.name && user?.user_id === r.user_id
    ) ??
      localRatings?.find((r: Rating) => r.image_name === image.name)) ||
    new Rating();

  return (
    <div
      className={cn(
        "columns-2 gap-4 sm:columns-3 md:columns-4 lg:columns-5",
        className
      )}
    >
      {images.map((image: ImageFile, index: number) => (
        <PinterestImage
          disabled={ratingDisabled}
          key={image.id}
          rating={rating(image)}
          image={image}
          index={index}
          isHovered={hoveredImage === image.id}
          isLoaded={loadedImages.has(image.id)}
          onHover={() => handleMouseEnter(image.id)}
          onLeave={handleMouseLeave}
          onClick={() => handleImageClick(index)}
          onLoad={() => handleImageLoad(image.id)}
          onRatingChange={(value, ratingId) =>
            handleRatingChange(image.name, value, ratingId)
          }
        />
      ))}
    </div>
  );
}

const PinterestImage = memo(function PinterestImage({
  disabled,
  image,
  index,
  isHovered,
  isLoaded,
  rating,
  onHover,
  onLeave,
  onClick,
  onLoad,
  onRatingChange,
}: {
  disabled: boolean;
  rating: Rating;
  image: ImageFile;
  index: number;
  isHovered: boolean;
  isLoaded: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onLoad: () => void;
  onRatingChange: (value: number, ratingId?: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <motion.div
        className="mb-4 break-inside-avoid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
      >
        <p className="mt-2 truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {image.name}
        </p>
        <StarRatingSlider
          disabled={disabled}
          value={rating.value || 0}
          onRatingChange={(value) => onRatingChange(value, rating.rating_id)}
          className="w-full flex justify-center mt-1"
        />

        <EditImageView
          image={image}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      </motion.div>
    </>
  );
});
