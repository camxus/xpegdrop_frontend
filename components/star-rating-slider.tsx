"use client";

import type React from "react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Dot, Star } from "lucide-react";

interface RatingSliderProps {
  value: number;
  onRatingChange: (rating: number) => void;
  showBullets?: boolean;
  className?: string;
}

const STAR_AMOUNT = 5;

export function StarRatingSlider({
  value,
  onRatingChange,
  showBullets = true,
  className,
}: RatingSliderProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
      ref={containerRef}
      className={cn(
        "flex items-center gap-1 cursor-pointer select-none py-1",
        className
      )}
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
              className={cn(
                "w-3 h-3 rounded-full transition-colors duration-150",
                "fill-white"
              )}
            />
          ) : (
            <Star
              className={cn(
                "w-3 h-3 transition-colors duration-150",
                "text-muted-foreground/30"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
