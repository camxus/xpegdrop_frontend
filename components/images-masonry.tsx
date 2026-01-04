"use client";

import { useState, memo, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/types";
import StarRatingSlider from "./star-rating-slider";
import { Rating, ratingsApi } from "@/lib/api/ratingsApi";
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
import { useModal } from "@/hooks/use-modal";
import { NotesModal } from "./notes-modal";
import { Note } from "@/lib/api/notesApi";
import { MessageSquareText } from "lucide-react";
import { useUser } from "@/hooks/api/useUser";
import { useDialog } from "@/hooks/use-dialog";
import UnauthorizedRatingDialog, { UnauthorizedRatingDialogActions } from "./unauthorized-rating-dialog";
import { useProjects } from "@/hooks/api/useProjects";
import { MasonryGrid } from "./layout/masonry";

interface ImagesMasonryProps {
  projectId: string;
  projectNotes: Note[];
  ratingDisabled?: boolean;
  images: ImageFile[];
  ratings?: Rating[];
  className?: string;
  canEdit?: boolean;
  selectedImages?: Set<string>
  onImageClick?: (imageIndex: number) => void;
  onImageHoverChange?: (isHovering: boolean) => void;
  onRatingChange?: (imageId: string, value: number, ratingId?: string) => void;
  onDuplicateImage?: (image: ImageFile) => void;
  onSelectChange?: (value: Set<ImageFile["id"]>) => void;
}

export function ImagesMasonry({
  projectId,
  projectNotes,
  ratingDisabled = false,
  images,
  ratings,
  className,
  canEdit,
  selectedImages,
  onImageClick,
  onImageHoverChange,
  onRatingChange,
  onDuplicateImage,
  onSelectChange,
}: ImagesMasonryProps) {
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

  const handleDuplicateImage = useCallback(
    (image: ImageFile) => {
      onDuplicateImage?.(image);
    },
    [onDuplicateImage]
  );

  const hanldeSelectImage = useCallback(
    (image: ImageFile) => {
      if (!selectedImages) return
      if (!selectedImages.has(image.id)) {
        selectedImages.add(image.id)
      } else {
        selectedImages.delete(image.id)
      }
      onSelectChange?.(selectedImages);
    },
    [onSelectChange, selectedImages]
  );


  const localRatings =
    projectId && (getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {})[projectId];

  const imageRatings = (image: ImageFile) =>
    ratings?.filter((rating) => rating.image_name === image.name) || [];

  const rating = (image: ImageFile) =>
    (ratings?.find(
      (r) => r.image_name === image.name && user?.user_id === r.user_id
    ) ??
      localRatings?.find((r: Rating) => r.image_name === image.name)) ||
    new Rating();

  const imageNotes = (image: ImageFile) =>
    projectNotes?.filter((note) => note.image_name === image.name);

  return (
    <MasonryGrid>
      {images.map((image: ImageFile, index: number) => (
        <MasonryImage
          projectId={projectId}
          imageNotes={imageNotes(image)}
          disabled={ratingDisabled}
          key={image.id}
          ratings={imageRatings(image)}
          rating={rating(image)}
          image={image}
          index={index}
          isHovered={hoveredImage === image.id}
          isLoaded={loadedImages.has(image.id)}
          canEdit={canEdit}
          isSelected={!!selectedImages?.has(image.id)}
          onHover={() => handleMouseEnter(image.id)}
          onLeave={handleMouseLeave}
          onClick={() => handleImageClick(index)}
          onLoad={() => handleImageLoad(image.id)}
          onRatingChange={(value, ratingId) =>
            handleRatingChange(image.name, value, ratingId)
          }
          onDuplicateImage={handleDuplicateImage}
          onToggleSelect={hanldeSelectImage}
        />
      ))}
    </MasonryGrid>
  )
}

const MasonryImage = memo(function MasonryImage({
  projectId,
  imageNotes,
  disabled,
  image,
  index,
  isHovered,
  isLoaded,
  ratings,
  rating,
  canEdit,
  isSelected,
  onHover,
  onLeave,
  onClick,
  onLoad,
  onRatingChange,
  onDuplicateImage,
  onToggleSelect,
}: {
  projectId: string;
  imageNotes: Note[];
  disabled: boolean;
  ratings: Rating[];
  rating: Rating;
  image: ImageFile;
  index: number;
  isHovered: boolean;
  isLoaded: boolean;
  canEdit?: boolean;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onLoad: () => void;
  onRatingChange: (value: number, ratingId?: string) => void;
  onDuplicateImage: (image: ImageFile) => void;
  onToggleSelect: (image: ImageFile) => void;
}) {
  const { removeProjectFile: { mutateAsync: removeProjectFile } } = useProjects()


  const modal = useModal();

  const [editOpen, setEditOpen] = useState(false);

  const handleShowImageNotes = () => {
    modal.show({
      title: `Notes`,
      content: () => (
        <NotesModal projectId={projectId} imageName={image.name} />
      ),
      height: "400px",
      width: "500px",
    });
  };

  const handleDeleteImage = async () => {
    await removeProjectFile({ projectId, fileName: image.name })

  }

  return (
    <>
      <motion.div
        className="mb-4 break-inside-avoid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "group relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all duration-300 hover:shadow-xl",
                isHovered && "hover:scale-[1.02]",
                isSelected && "scale-[0.96] ring-2 ring-foreground"
              )}
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              onClick={onClick}
            >
              <div
                className={cn(
                  "absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg z-20 pointer-events-none hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]",
                  isHovered &&
                  "border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                )}
              />
              <Image
                key={image.name}
                src={image.url || "/placeholder.svg"}
                alt={image.name}
                width={300}
                height={400}
                loading="lazy"
                onLoad={onLoad}
                className={cn(
                  "h-auto w-full object-cover transition-all duration-300",
                  isLoaded ? "opacity-100" : "opacity-0",
                  isHovered && "brightness-105"
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onToggleSelect(image)}>
              {isSelected ? "Deselect" : "Select"}
            </ContextMenuItem>
            {/* <ContextMenuItem onClick={() => setEditOpen(true)}>
              Edit
            </ContextMenuItem> */}
            <ContextMenuItem onClick={() => onDuplicateImage(image)}>
              Duplicate (beta)
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleShowImageNotes()}>
              Show Notes
            </ContextMenuItem>
            {/* <ContextMenuSeparator /> */}
            {canEdit && <ContextMenuItem onClick={() => handleDeleteImage()}>
              <span className="text-destructive-foreground">Delete</span>
            </ContextMenuItem>}
          </ContextMenuContent>
        </ContextMenu>

        <p className="mt-2 truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {image.name}
        </p>
        <div className="relative flex items-center gap-1 mt-1">
          <StarRatingSlider
            disabled={disabled}
            value={rating.value || 0}
            ratings={ratings}
            onRatingChange={(value) => onRatingChange(value, rating.rating_id)}
            className="w-full flex justify-center"
          />
          {!!imageNotes.length && (
            <MessageSquareText
              className="cursor-pointer absolute w-4 h-4 right-0"
              onClick={() => handleShowImageNotes()}
            />
          )}
        </div>

        <EditImageView
          image={image}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      </motion.div>
    </>
  );
});
