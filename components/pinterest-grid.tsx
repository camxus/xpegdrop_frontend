"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ImageFile } from "@/types"

interface PinterestGridProps {
  images: ImageFile[]
  className?: string
  onImageClick?: (imageIndex: number) => void
  onImageHoverChange?: (isHovering: boolean) => void // New prop
}

export function PinterestGrid({ images, className, onImageClick, onImageHoverChange }: PinterestGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)

  const handleImageLoad = (imageId: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageId))
  }

  const handleMouseEnter = (imageId: string) => {
    setHoveredImage(imageId)
    onImageHoverChange?.(true) // Notify parent that an image is hovered
  }

  const handleMouseLeave = () => {
    setHoveredImage(null)
    onImageHoverChange?.(false) // Notify parent that no image is hovered
  }

  const handleImageClick = (imageIndex: number) => {
    onImageClick?.(imageIndex)
  }

  return (
    <div className={cn("columns-2 gap-4 sm:columns-3 md:columns-4 lg:columns-5", className)}>
      {images.map((image, index) => (
        <div key={image.id} className="mb-4 break-inside-avoid">
          <div
            className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            onMouseEnter={() => handleMouseEnter(image.id)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleImageClick(index)}
          >
            {/* White border animation restored */}
            <div
              className={cn(
                "absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg z-20 pointer-events-none",
                hoveredImage === image.id && "border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]",
              )}
            />

            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.name}
              width={300}
              height={400}
              className={cn(
                "h-auto w-full object-cover transition-all duration-300",
                loadedImages.has(image.id) ? "opacity-100" : "opacity-0",
                hoveredImage === image.id && "brightness-105", // Slight brightness on individual hover
              )}
              onLoad={() => handleImageLoad(image.id)}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />

            {!loadedImages.has(image.id) && <div className="absolute inset-0 animate-pulse bg-muted" />}
          </div>
          <p className="mt-2 truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {image.name}
          </p>
        </div>
      ))}
    </div>
  )
}
