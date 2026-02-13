"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("inline-flex bg-muted p-1 rounded-md", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "cursor-pointer px-6 py-1 rounded-md text-sm font-medium transition-colors",
        "data-[state=on]:bg-foreground/20 data-[state=on]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
