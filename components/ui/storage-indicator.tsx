import React from 'react'
import { cn } from '@/lib/utils'
import { Progress } from './progress'

export default function StorageIndicator({ percentage, type = "fframess" }: { percentage: number, type?: string }) {
  return (
    <>
      <span className="text-xs text-white/80">
        {type}{" "}Storage{" "}
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
