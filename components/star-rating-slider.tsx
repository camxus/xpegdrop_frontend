"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn, getInitials } from "@/lib/utils";
import { Dot, Star } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { useUsers } from "@/hooks/api/useUser";
import { Rating } from "@/lib/api/ratingsApi";
import { useAuth } from "@/hooks/api/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import { useNotes } from "@/hooks/api/useNotes";

interface RatingSliderProps {
  value: number;
  onRatingChange: (rating: number) => void;
  ratings?: Rating[];
  showBullets?: boolean;
  className?: string;
  disabled?: boolean;
}

const STAR_AMOUNT = 5;

export default function StarRatingWithAvatars({
  value,
  onRatingChange,
  ratings,
  showBullets = true,
  className,
  disabled,
}: RatingSliderProps) {
  const { user } = useAuth();

  const [hoverRating, setHoverRating] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // fetch users excluding current user
  const queries = useUsers(
    ratings
      ?.map((rating) => rating.user_id)
      .filter((userId) => userId !== user?.user_id) || []
  );

  const users = Array.from(
    new Map(queries.map((u) => [u.data?.user_id, u.data])).values()
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const newHoverRating = Math.ceil((relativeX / rect.width) * STAR_AMOUNT);
    setHoverRating(Math.max(1, Math.min(STAR_AMOUNT, newHoverRating)));
  };

  const handleMouseLeave = () => setHoverRating(value || 0);
  const handleClick = () => onRatingChange(hoverRating);

  const displayRating = hoverRating || value;

  // group users by star rating
  const usersByStar = Array.from(
    { length: STAR_AMOUNT },
    (_, i) => STAR_AMOUNT - i
  ).map((starRating) => ({
    starRating,
    users: users.filter((user) =>
      ratings?.some(
        (r) => r.user_id === user?.user_id && r.value === starRating
      )
    ),
  }));

  function renderStars(ratingValue: number, showBullets = true) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: STAR_AMOUNT }, (_, i) => i + 1).map((star) => {
          const isFilled = star <= ratingValue;

          return (
            <AnimatePresence mode="popLayout" key={star}>
              <motion.div
                key={`${star}-${isFilled ? "filled" : "empty"}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center"
              >
                {isFilled ? (
                  <Star className="w-3 h-3 fill-white text-white" />
                ) : showBullets ? (
                  <Dot className="w-3 h-3 rounded-full fill-white" />
                ) : (
                  <Star className="w-4 h-4 text-muted-foreground/30" />
                )}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "py-1 transition-opacity w-full",
        className,
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {/* Star rating */}
      <div
        ref={containerRef}
        className="flex items-center gap-1 cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleClick}
      >
        {renderStars(displayRating, showBullets)}
      </div>

      {/* AvatarGroup with tooltip showing users per star */}
      {!!users.length && (
        <AvatarGroup
          size="xs"
          className="ml-2"
          users={users.map((user) => ({
            id: user?.user_id || "",
            name: getInitials(user?.first_name || "", user?.last_name || ""),
            src: user?.avatar as string,
            stars:
              ratings?.filter((r) => r.user_id === user?.user_id).length || 0,
          }))}
          tooltipContent={() => (
            <div className="flex flex-col p-2 space-y-2 bg-black/90 rounded-md">
              {usersByStar.map(({ starRating, users }) => {
                if (!users.length) return null;

                return (
                  <div key={starRating} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(starRating, showBullets)}
                      </div>
                      <AvatarGroup
                        size="xs"
                        users={users.map((user) => ({
                          id: user?.user_id || "",
                          name: getInitials(
                            user?.first_name || "",
                            user?.last_name || ""
                          ),
                          src: user?.avatar as string,
                        }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
      )}
    </div>
  );
}
