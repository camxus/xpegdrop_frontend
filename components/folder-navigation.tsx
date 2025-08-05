"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FolderNavigationProps {
  currentIndex: number
  totalFolders: number
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export function FolderNavigation({ currentIndex, totalFolders, onPrevious, onNext, className }: FolderNavigationProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="flex items-center gap-2 bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        {currentIndex + 1} of {totalFolders}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={currentIndex === totalFolders - 1}
        className="flex items-center gap-2 bg-transparent"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
