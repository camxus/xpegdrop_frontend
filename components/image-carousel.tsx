"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImageFile } from "@/types"

interface ImageCarouselProps {
  images: ImageFile[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function ImageCarousel({ images, initialIndex, isOpen, onClose }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 50

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsLoading(true)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsLoading(true)
    }
  }, [currentIndex, images.length])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
      }
    },
    [isOpen, onClose, handlePrevious, handleNext]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) handleNext()
    else if (isRightSwipe) handlePrevious()
  }

  if (!isOpen) return null

  const currentImage = images[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <h3 className="font-semibold">{currentImage?.name}</h3>
          <p className="text-sm text-white/70">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main carousel */}
      <div
        ref={carouselRef}
        className="flex items-center justify-center h-full p-4 pt-20 pb-20"
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

        {/* Image container */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            <Image
              src={currentImage?.url || "/placeholder.svg"}
              alt={currentImage?.name || "Image"}
              width={1200}
              height={800}
              className={cn(
                "max-w-full max-h-[80vh] w-auto h-auto object-contain transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              priority
            />
          </div>
        </div>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Bottom navigation dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx)
              setIsLoading(true)
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              idx === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            )}
          />
        ))}
      </div>

      {/* Swipe indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Swipe or use arrow keys to navigate
      </div>
    </div>
  )
}
