"use client";

import type * as React from "react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { type Accept, useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

export type FileUploaderRef = {
  open: () => void;
};

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  directory?: boolean; // New prop for folder upload
}

export const FileUploader = forwardRef<FileUploaderRef, FileUploaderProps>(
  (
    {
      onFilesSelected,
      accept,
      maxFiles = 1,
      maxSize = 104857600000,
      disabled = false,
      children,
      className,
      directory = false,
      ...props
    },
    ref
  ) => {
    const [isDragActive, setIsDragActive] = useState(false);

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        onFilesSelected(acceptedFiles);
      },
      [onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragReject, open } = useDropzone({
      onDrop,
      accept: directory ? undefined : accept,
      maxFiles: directory ? undefined : maxFiles, // Allow unlimited files if directory upload
      maxSize,
      disabled,
      // noClick: true,
      onDragEnter: () => setIsDragActive(true),
      onDragLeave: () => setIsDragActive(false),
      onDropAccepted: () => setIsDragActive(false),
      onDropRejected: () => setIsDragActive(false),
    });

    useImperativeHandle(ref, () => ({
      open,
    }));

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
);

FileUploader.displayName = "FileUploader";
