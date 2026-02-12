"use client";

import { useState, memo, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import type { MediaFile } from "@/types";
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
import { Metadata } from "@/types/metadata";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface MediaMasonryProps {
  projectId: string;
  projectNotes: Note[];
  ratingDisabled?: boolean;
  media: MediaFile[];
  metadata: Metadata[];
  ratings?: Rating[];
  className?: string;
  canEdit?: boolean;
  selectedMedia?: Set<string>
  onMediaClick?: (mediaIndex: number) => void;
  onMediaHoverChange?: (isHovering: boolean) => void;
  onRatingChange?: (mediaName: string, value: number, ratingId?: string) => void;
  onDuplicateMedia?: (media: MediaFile) => void;
  onDeleteMedia?: (media: MediaFile) => void;
  onSelectChange?: (value: Set<MediaFile["id"]>) => void;
}

export function MediaMasonry({
  projectId,
  projectNotes,
  ratingDisabled = false,
  media,
  metadata,
  ratings,
  className,
  canEdit,
  selectedMedia,
  onMediaClick,
  onMediaHoverChange,
  onRatingChange,
  onDuplicateMedia,
  onDeleteMedia,
  onSelectChange,
}: MediaMasonryProps) {
  const { user } = useAuth();

  const [loadedMedias, setLoadedMedia] = useState<Set<string>>(new Set());
  const [hoveredMedia, setHoveredMedia] = useState<string | null>(null);

  const handleMediaLoad = useCallback((mediaName: string) => {
    setLoadedMedia((prev) => {
      if (prev.has(mediaName)) return prev;
      const newSet = new Set(prev);
      newSet.add(mediaName);
      return newSet;
    });
  }, []);

  const handleMouseEnter = useCallback(
    (mediaName: string) => {
      if (hoveredMedia !== mediaName) {
        setHoveredMedia(mediaName);
        onMediaHoverChange?.(true);
      }
    },
    [hoveredMedia, onMediaHoverChange]
  );

  const handleMouseLeave = useCallback(() => {
    if (hoveredMedia !== null) {
      setHoveredMedia(null);
      onMediaHoverChange?.(false);
    }
  }, [hoveredMedia, onMediaHoverChange]);

  const handleMediaClick = useCallback(
    (mediaIndex: number) => {
      onMediaClick?.(mediaIndex);
    },
    [onMediaClick]
  );

  const handleRatingChange = useCallback(
    (mediaName: string, value: number, ratingId?: string) => {
      onRatingChange?.(mediaName, value, ratingId);
    },
    [onRatingChange]
  );

  const handleDuplicateMedia = useCallback(
    (mediaFile: MediaFile) => {
      onDuplicateMedia?.(mediaFile);
    },
    [onDuplicateMedia]
  );

  const handleDeleteMedia = useCallback(
    (mediaFile: MediaFile) => {
      onDeleteMedia?.(mediaFile);
    },
    [onDeleteMedia]
  );

  const hanldeSelectMedia = useCallback(
    (mediaFile: MediaFile) => {
      if (!selectedMedia) return
      if (!selectedMedia.has(mediaFile.id)) {
        selectedMedia.add(mediaFile.id)
      } else {
        selectedMedia.delete(mediaFile.id)
      }
      onSelectChange?.(selectedMedia);
    },
    [onSelectChange, selectedMedia]
  );


  const localRatings =
    (projectId && (getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {})[projectId]) || undefined;

  const mediaRatings = (mediaFile: MediaFile) =>
    ratings?.filter((rating) => rating.media_name === mediaFile.name) || [];

  const mediaMetadata = (mediaFile: MediaFile) =>
  (metadata?.find(
    (m) => m.media_name === mediaFile.name
  ));

  const rating = (mediaFile: MediaFile) =>
    (ratings?.find(
      (r) => r.media_name === mediaFile.name && user?.user_id === r.user_id
    ) ??
      localRatings?.find((r: Rating) => r.media_name === mediaFile.name)) ||
    new Rating();

  const mediaNotes = (mediaFile: MediaFile) =>
    projectNotes?.filter((note) => note.media_name === mediaFile.name);

  return (
    <MasonryGrid>
      {media.map((mediaFile: MediaFile, index: number) => (
        <>
          <MasonryMedia
            projectId={projectId}
            metadata={mediaMetadata(mediaFile)}
            mediaNotes={mediaNotes(mediaFile)}
            disabled={ratingDisabled}
            key={mediaFile.id}
            ratings={mediaRatings(mediaFile)}
            rating={rating(mediaFile)}
            mediaFile={mediaFile}
            index={index}
            isHovered={hoveredMedia === mediaFile.id}
            isLoaded={loadedMedias.has(mediaFile.id)}
            canEdit={canEdit}
            isSelected={!!selectedMedia?.has(mediaFile.id)}
            onHover={() => handleMouseEnter(mediaFile.id)}
            onLeave={handleMouseLeave}
            onClick={() => handleMediaClick(index)}
            onLoad={() => handleMediaLoad(mediaFile.id)}
            onRatingChange={(value, ratingId) =>
              handleRatingChange(mediaFile.name, value, ratingId)
            }
            onDuplicateMedia={handleDuplicateMedia}
            onDeleteMedia={handleDeleteMedia}
            onToggleSelect={hanldeSelectMedia}
          />
        </>
      ))}
    </MasonryGrid>
  )
}

const MasonryMedia = memo(function MasonryMedia({
  projectId,
  mediaNotes,
  metadata,
  disabled,
  mediaFile,
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
  onDuplicateMedia,
  onDeleteMedia,
  onToggleSelect,
}: {
  projectId: string;
  mediaNotes: Note[];
  metadata?: Metadata
  disabled: boolean;
  ratings: Rating[];
  rating: Rating;
  mediaFile: MediaFile;
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
  onDuplicateMedia: (mediaFile: MediaFile) => void;
  onDeleteMedia: (mediaFile: MediaFile) => void;
  onToggleSelect: (mediaFile: MediaFile) => void;
}) {
  const { user } = useAuth()
  const { getUserById } = useUser()

  const { data: uploadUser } = getUserById(user?.user_id !== metadata?.user_id ? metadata?.user_id : undefined)

  const { removeProjectFile: { mutateAsync: removeProjectFile } } = useProjects()

  const modal = useModal();

  const [editOpen, setEditOpen] = useState(false);

  const handleShowMediaNotes = () => {
    modal.show({
      title: `Notes`,
      content: () => (
        <NotesModal projectId={projectId} mediaName={mediaFile.name} />
      ),
      height: "400px",
      width: "500px",
    });
  };

  const handleDeleteMedia = async () => {
    onDeleteMedia(mediaFile)
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
                isSelected && "scale-[0.96] ring-2 ring-white"
              )}
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              onClick={onClick}
            >
              {uploadUser &&
                <div className="absolute top-2 right-2 z-30">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="absolute top-2 right-2 z-30">
                          <Avatar className="h-6 w-6 cursor-default">
                            <AvatarImage src={uploadUser?.avatar as string} />
                            <AvatarFallback className="text-lg">
                              {getInitials(uploadUser?.first_name || "", "")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </TooltipTrigger>

                      <TooltipContent
                        side="top"
                        align="end"
                        className="bg-background/90 backdrop-blur p-2 text-xs"
                      >
                        <span className="whitespace-nowrap">
                          Uploaded by {uploadUser?.first_name} {uploadUser?.last_name}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
              <div
                className={cn(
                  "absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg z-20 pointer-events-none hover:border-foreground",
                  isHovered && "border-white"
                )}
                style={{
                  boxShadow: `0 0 20px rgba(var(--foreground-rgb), 0.5)`,
                }}
              />
              <Image
                key={mediaFile.name}
                src={mediaFile.thumbnail_url || "/placeholder.svg"}
                alt={mediaFile.name}
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
            <ContextMenuItem onClick={() => onToggleSelect(mediaFile)}>
              {isSelected ? "Deselect" : "Select"}
            </ContextMenuItem>
            {/* <ContextMenuItem onClick={() => setEditOpen(true)}>
              Edit
            </ContextMenuItem> */}
            <ContextMenuItem onClick={() => onDuplicateMedia(mediaFile)}>
              Duplicate (beta)
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleShowMediaNotes()}>
              Show Notes
            </ContextMenuItem>
            {/* <ContextMenuSeparator /> */}
            {canEdit && <ContextMenuItem onClick={() => handleDeleteMedia()}>
              <span className="text-destructive-foreground">Delete</span>
            </ContextMenuItem>}
          </ContextMenuContent>
        </ContextMenu>

        <p className="mt-2 truncate text-xs font-light text-muted-foreground group-hover:text-foreground transition-colors">
          {mediaFile.name}
        </p>
        <div className="relative flex items-center gap-1 mt-1">
          <StarRatingSlider
            disabled={disabled}
            value={rating.value || 0}
            ratings={ratings}
            onRatingChange={(value) => onRatingChange(value, rating.rating_id)}
            className="w-full flex justify-center"
          />
          {!!mediaNotes.length && (
            <MessageSquareText
              className="cursor-pointer absolute w-4 h-4 right-0"
              onClick={() => handleShowMediaNotes()}
            />
          )}
        </div>

        <EditImageView
          image={mediaFile}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      </motion.div>
    </>
  );
});
