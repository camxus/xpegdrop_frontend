"use client"

import { useState, memo, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ImageFile } from "@/types"

interface PinterestGridProps {
  images: ImageFile[]
  className?: string
  onImageClick?: (imageIndex: number) => void
  onImageHoverChange?: (isHovering: boolean) => void
}

export function PinterestGrid({
  images,
  className,
  onImageClick,
  onImageHoverChange,
}: PinterestGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages((prev) => {
      if (prev.has(imageId)) return prev
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
  }, [])

  const handleMouseEnter = useCallback(
    (imageId: string) => {
      if (hoveredImage !== imageId) {
        setHoveredImage(imageId)
        onImageHoverChange?.(true)
      }
    },
    [hoveredImage, onImageHoverChange],
  )

  const handleMouseLeave = useCallback(() => {
    if (hoveredImage !== null) {
      setHoveredImage(null)
      onImageHoverChange?.(false)
    }
  }, [hoveredImage, onImageHoverChange])

  const handleImageClick = useCallback(
    (imageIndex: number) => {
      onImageClick?.(imageIndex)
    },
    [onImageClick],
  )

  return (
    <div className={cn("columns-2 gap-4 sm:columns-3 md:columns-4 lg:columns-5", className)}>
      {images.map((image, index) => (
        <PinterestImage
          key={image.id}
          image={image}
          index={index}
          isHovered={hoveredImage === image.id}
          isLoaded={loadedImages.has(image.id)}
          onHover={() => handleMouseEnter(image.id)}
          onLeave={handleMouseLeave}
          onClick={() => handleImageClick(index)}
          onLoad={() => handleImageLoad(image.id)}
        />
      ))}
    </div>
  )
}

// ✅ Memoized PinterestImage sub-component
const PinterestImage = memo(function PinterestImage({
  image,
  index,
  isHovered,
  isLoaded,
  onHover,
  onLeave,
  onClick,
  onLoad,
}: {
  image: ImageFile
  index: number
  isHovered: boolean
  isLoaded: boolean
  onHover: () => void
  onLeave: () => void
  onClick: () => void
  onLoad: () => void
}) {
  return (
    <div className="mb-4 break-inside-avoid">
      <div
        className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        <div
          className={cn(
            "absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg z-20 pointer-events-none",
            isHovered && "border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]",
          )}
        />
        <Image
          src={image.url || "/placeholder.svg"}
          alt={image.name}
          width={300}
          height={400}
          loading="lazy"
          onLoad={onLoad}
          className={cn(
            "h-auto w-full object-cover transition-all duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            isHovered && "brightness-105",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      </div>
      <p className="mt-2 truncate text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {image.name}
      </p>
    </div>
  )
})
