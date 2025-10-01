"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { cn, getInitials } from "@/lib/utils";
import { Dot, Star } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"; // adjust path
import { useUsers } from "@/hooks/api/useUser";
import { Rating } from "@/lib/api/ratingsApi";
import { useAuth } from "@/hooks/api/useAuth";

interface RatingSliderProps {
  value: number;
  onRatingChange: (rating: number) => void;
  ratings?: Rating[]; // pass userIds here instead of JSX
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

  // fetch users
  const queries = useUsers(
    ratings
      ?.map((rating) => rating.user_id)
      .filter((userId) => userId !== user?.user_id) || []
  );

  const users = Array.from(
    new Map(queries.map((user) => [user.data?.user_id, user.data])).values()
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

  return (
    <div
      className={cn(
        "py-1 transition-opacity w-full",
        className,
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-1 cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleClick}
      >
        {Array.from({ length: STAR_AMOUNT }, (_, i) => i + 1).map((star) => (
          <div key={star}>
            {star <= displayRating ? (
              <Star
                className={cn(
                  "w-3 h-3 transition-colors duration-150",
                  "fill-white text-white"
                )}
              />
            ) : showBullets ? (
              <Dot
                width={10}
                height={10}
                className="w-3 h-3 rounded-full fill-white transition-colors duration-150"
              />
            ) : (
              <Star className="w-4 h-4 text-muted-foreground/30 transition-colors duration-150" />
            )}
          </div>
        ))}
      </div>

      {/* Avatars to the right */}
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
              {Array.from({ length: STAR_AMOUNT }, (_, i) => i + 1)
                .reverse()
                .map((starRating) => {
                  const usersForStar = users.filter((user) =>
                    ratings?.some(
                      (r) =>
                        r.user_id === user?.user_id && r.value === starRating
                    )
                  );

                  if (!usersForStar.length) return null;

                  return (
                    <div key={starRating} className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from(
                            { length: STAR_AMOUNT },
                            (_, i) => i + 1
                          ).map((star) => (
                            <div key={star}>
                              {star <= starRating ? (
                                <Star
                                  className={cn(
                                    "w-3 h-3 transition-colors duration-150",
                                    "fill-white text-white"
                                  )}
                                />
                              ) : showBullets ? (
                                <Dot
                                  width={10}
                                  height={10}
                                  className="w-3 h-3 rounded-full fill-white transition-colors duration-150"
                                />
                              ) : (
                                <Star className="w-4 h-4 text-muted-foreground/30 transition-colors duration-150" />
                              )}
                            </div>
                          ))}
                        </div>
                        <AvatarGroup
                          size="xs"
                          users={usersForStar.map((user) => ({
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
