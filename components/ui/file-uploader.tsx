"use client";

import type * as React from "react";
import { useCallback, useState } from "react";
import { type Accept, useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  directory?: boolean; // New prop for folder upload
}

export function FileUploader({
  onFilesSelected,
  accept,
  maxFiles = 1,
  maxSize = 104857600000, // 10MB
  disabled = false,
  children,
  className,
  directory = false, // Default to false
  ...props
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: directory ? undefined : accept,
    maxFiles: directory ? undefined : maxFiles, // Allow unlimited files if directory upload
    maxSize,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input transition-colors",
        isDragActive && "border-primary/50 bg-primary/5",
        isDragReject && "border-destructive/50 bg-destructive/5",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      {...props}
    >
      <input
        {...getInputProps()}
        {...(directory && { webkitdirectory: "true", directory: "true" })}
      />
      {children}
    </div>
  );
}
