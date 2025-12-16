import React from 'react'
import { cn } from '@/lib/utils'
import { Progress } from './progress'

export default function StorageIndicator({ percentage, isDropbox = false }: { percentage: number, isDropbox?: boolean }) {
  return (
    <>
      <span className="text-xs text-muted-foreground">
        {isDropbox ? "Dropbox" : "fframess"}{" "}Storage{" "}
        {percentage >= 90
          ? "Full"
          : percentage >= 70
            ? "Almost Full"
            : `${percentage.toFixed(0)}%`}
      </span>

      <Progress
        value={percentage}
        color={
          percentage >= 90
            ? "bg-red-400"
            : percentage >= 70
              ? "bg-amber-400"
              : "bg-white"
        }
        className={cn("w-full h-1 rounded-full")}
      /></>
  )
}
