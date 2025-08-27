"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUploader } from "@/components/ui/file-uploader";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalFileUploader({
  directory,
  onFilesSelected,
}: {
  directory: boolean;
  onFilesSelected: (files: File[]) => void;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

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

      if (e.dataTransfer?.files) {
        const files = Array.from(e.dataTransfer.files);
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
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
      {showOverlay && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <FileUploader
            onFilesSelected={onFilesSelected}
            accept={{ "image/*": [] }}
            maxFiles={1000}
            directory={directory}
            className="h-screen w-screen border-2 border-dashed border-primary flex items-center justify-center"
          >
            <p className="text-lg font-semibold text-center">
              Drop files or folders here
            </p>
          </FileUploader>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
