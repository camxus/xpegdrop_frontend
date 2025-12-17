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

interface PinterestGridProps {
  projectId: string;
  projectNotes: Note[];
  ratingDisabled?: boolean;
  images: ImageFile[];
  ratings?: Rating[];
  className?: string;
  onImageClick?: (imageIndex: number) => void;
  onImageHoverChange?: (isHovering: boolean) => void;
  onRatingChange?: (imageId: string, value: number, ratingId?: string) => void;
  onDuplicateImage?: (image: ImageFile) => void;
}

export function PinterestGrid({
  projectId,
  projectNotes,
  ratingDisabled = false,
  images,
  ratings,
  className,
  onImageClick,
  onImageHoverChange,
  onRatingChange,
  onDuplicateImage,
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

  const handleDuplicateImage = useCallback(
    (image: ImageFile) => {
      onDuplicateImage?.(image);
    },
    [onDuplicateImage]
  );

  const localRatings =
    ratings?.[0]?.project_id &&
    (getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {})[ratings?.[0].project_id];
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
    <div
      className={cn(
        "columns-2 gap-4 sm:columns-3 md:columns-4 lg:columns-5",
        className
      )}
    >
      {images.map((image: ImageFile, index: number) => (
        <PinterestImage
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
          onHover={() => handleMouseEnter(image.id)}
          onLeave={handleMouseLeave}
          onClick={() => handleImageClick(index)}
          onLoad={() => handleImageLoad(image.id)}
          onRatingChange={(value, ratingId) =>
            handleRatingChange(image.name, value, ratingId)
          }
          onDuplicateImage={handleDuplicateImage}
        />
      ))}
    </div>
  );
}

const PinterestImage = memo(function PinterestImage({
  projectId,
  imageNotes,
  disabled,
  image,
  index,
  isHovered,
  isLoaded,
  ratings,
  rating,
  onHover,
  onLeave,
  onClick,
  onLoad,
  onRatingChange,
  onDuplicateImage,
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
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onLoad: () => void;
  onRatingChange: (value: number, ratingId?: string) => void;
  onDuplicateImage: (image: ImageFile) => void;
}) {
  const { user } = useAuth()
  const { localUser, setLocalUser } = useUser()

  const {removeProjectFile: {mutateAsync: removeProjectFile}} = useProjects()

  const modal = useModal();
  const dialog = useDialog();

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

  const handleRatingChange = (value: number) => {

    const firstName = user?.first_name ?? localUser.first_name;
    const lastName = user?.last_name ?? localUser.last_name;

    if (!firstName || !lastName) {
      dialog.show({
        title: "You're currently not signed in",
        description: "Leave a note with your name so the owner knows who accessed this folder.",
        content: UnauthorizedRatingDialog,
        actions: UnauthorizedRatingDialogActions,
        contentProps: {
          onSubmit: (firstName: string, lastName: string) => {
            if (!firstName || !lastName) return

            setLocalUser({ first_name: firstName, last_name: lastName })
            onRatingChange(value, rating.rating_id)

            return
          }
        }
      })
      return
    }

    onRatingChange(value, rating.rating_id)
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
              className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              onClick={onClick}
            >
              <div
                className={cn(
                  "absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg z-20 pointer-events-none",
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
            <ContextMenuItem onClick={() => handleDeleteImage()}>
            Delete
          </ContextMenuItem>
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
            onRatingChange={(value) => handleRatingChange(value)}
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
