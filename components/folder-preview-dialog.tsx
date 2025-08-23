"use client";

import { useState } from "react";
import Image from "next/image";
import { EditableTitle } from "@/components/editable-title";
import type { Folder } from "@/types";
import { Button } from "@/components/ui/button";

interface FolderPreviewContentProps {
  folders: Folder[];
  onRename: (folderIndex: number, newName: string) => void;
  editableTitle?: boolean
}

export function FolderPreviewContent({
  folders,
  onRename,
  editableTitle,
}: FolderPreviewContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentFolder = folders[currentIndex];

  if (!currentFolder) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Folder title */}
      <EditableTitle
        title={currentFolder.name}
        onSave={(newName) => onRename(currentIndex, newName)}
        editable={editableTitle}
      />

      {/* Images list */}
      <div className="flex flex-col divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
        {currentFolder.images.map((img) => (
          <div
            key={img.id}
            className="flex h-16 items-center gap-4 py-2 px-1"
          >
            <Image
              src={URL.createObjectURL(img.file)}
              alt={img.file.name}
              width={24}
              height={24}
              className="rounded object-cover"
            />
            <p className="text-sm truncate">{img.file.name}</p>
          </div>
        ))}
      </div>

      {/* Folder navigation */}
      {folders.length > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Folder {currentIndex + 1} of {folders.length}
          </p>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentIndex((i) => Math.min(folders.length - 1, i + 1))
            }
            disabled={currentIndex === folders.length - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface FolderPreviewActionsProps {
  folders: Folder[];
  onCancel: () => void;
  onUpload: (folders: Folder[]) => void;
}

export function FolderPreviewActions({ folders, onCancel, onUpload }: FolderPreviewActionsProps) {
  return (
    <>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={() => onUpload(folders)}>
        Upload {folders.length > 1 ? `${folders.length} Folders` : "Folder"}
      </Button>
    </>
  );
}