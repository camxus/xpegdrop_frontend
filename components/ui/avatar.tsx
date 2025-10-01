"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

type User = {
  id: string | number;
  name: string;
  src?: string;
};

type AvatarGroupProps = {
  users: User[];
  /** max number of avatars to show before collapsing into a +N */
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  tooltipContent?: (user: User) => React.ReactNode;
};

const SIZE_MAP: Record<string, string> = {
  xs: "w-4 h-4 text-xs",
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-12 h-12 text-base",
};

export default function AvatarGroup({
  users,
  max = 4,
  size = "md",
  className = "",
  tooltipContent,
}: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;
  const avatarSizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <div className={`flex items-center ${className}`}>
      <TooltipProvider>
        <div className="flex items-center -space-x-3">
          {visible.map((u) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <div
                  className={`inline-block rounded-full ring-2 ring-background bg-muted ${avatarSizeClass} flex items-center justify-center overflow-hidden`}
                >
                  <Avatar className="!w-full !h-full">
                    {u.src ? (
                      <AvatarImage src={u.src} alt={u.name} />
                    ) : (
                      <AvatarFallback className="cursor-default">{getInitials(u.name)[0]}</AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90" side="top">
                {tooltipContent ? (
                  tooltipContent(u)
                ) : (
                  <span className="whitespace-nowrap">{u.name}</span>
                )}
              </TooltipContent>
            </Tooltip>
          ))}

          {extra > 0 && (
            <div
              className={`inline-flex items-center justify-center rounded-full ring-2 ring-background bg-muted ${avatarSizeClass} text-xs font-medium`}
            >
              +{extra}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
