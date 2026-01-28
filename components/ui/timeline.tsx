import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { blurFadeInVariants, staggeredContainerVariants } from "@/lib/motion";

type TimelineStatus = "completed" | "in-progress" | "pending";

interface TimelineProps {
  children: React.ReactNode;
  className?: string;
}

export function Timeline({ children, className }: TimelineProps) {
  return (
    <motion.ol
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren: 0.2,
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
      className={cn("relative pl-6", className)}
    >
      {children}
    </motion.ol>
  );
}

interface TimelineItemProps {
  date: Date;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  status?: TimelineStatus;
  className?: string;
}

const statusStyles: Record<TimelineStatus, string> = {
  completed: "bg-green-500 text-white",
  "in-progress": "bg-blue-500 text-white animate-pulse",
  pending: "bg-muted text-muted-foreground",
};

export function TimelineItem({
  date,
  title,
  description,
  icon,
  status = "pending",
  className,
}: TimelineItemProps) {
  return (
    <motion.li
      variants={blurFadeInVariants}
      className={cn(
        "group relative pl-2 pb-10 last:pb-0",
        className
      )}
    >
      {/* Vertical line — hidden on last item */}
      <span
        aria-hidden
        className="absolute left-0 top-7 h-full w-px bg-muted group-last:hidden"
      />

      <div className="flex -translate-x-4.5 gap-2 items-center">
        {/* Bullet */}
        <span
          className={cn(
            "relative flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background",
            statusStyles[status]
          )}
        >
          {icon ?? <span className="h-2 w-2 rounded-full bg-current" />}
        </span>

        {/* Time */}
        <time className="text-xs text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </time>
      </div>

      <h3 className="text-sm leading-none">{title}</h3>

      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </motion.li>
  );
}
