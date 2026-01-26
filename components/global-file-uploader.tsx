"use client";

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { FileUploader, FileUploaderRef } from "@/components/ui/file-uploader";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const GlobalFileUploader = forwardRef<
  FileUploaderRef,
  {
    directory: boolean;
    onFilesSelected: (files: File[]) => void;
  }
>(({ directory, onFilesSelected }, ref) => {
  const uploaderRef = useRef<FileUploaderRef>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => uploaderRef.current?.open(),
  }));

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (e.dataTransfer?.types.includes("Files")) {
      setShowOverlay(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault(); // Allow drop
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setShowOverlay(false);
    },
    []
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    // If leaving the window completely
    if (e.relatedTarget === null) {
      setShowOverlay(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          !showOverlay && "pointer-events-none opacity-0"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: showOverlay ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <FileUploader
          ref={uploaderRef}
          onFilesSelected={onFilesSelected}
          accept={{ "image/*": [] }}
          maxFiles={1000}
          directory={directory}
          className="h-dvh w-screen border-2 border-dashed border-primary flex items-center justify-center"
        >
          <p className="text-lg font-semibold text-center">
            Drop files or folders here
          </p>
        </FileUploader>
      </motion.div>
    </AnimatePresence>
  );
})

GlobalFileUploader.displayName = "GlobalFileUploader";
