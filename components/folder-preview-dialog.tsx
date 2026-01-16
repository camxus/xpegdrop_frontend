"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { EditableTitle } from "@/components/editable-title";
import type { Folder, StorageProvider } from "@/types";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/hooks/use-dialog";
import { Switch } from "./ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/api/useAuth";
import { useTenants } from "./tenants-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AnimatePresence, motion } from "framer-motion";

interface FolderPreviewContentProps {
  folders: Folder[];
  onRename: (folderIndex: number, newName: string) => void;
  editable?: boolean;
}

export function FolderPreviewContent({
  folders,
  onRename,
  editable,
}: FolderPreviewContentProps) {
  const { updateProps } = useDialog();

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentFolder = folders[currentIndex];

  useEffect(() => {
    updateProps({ currentIndex });
  }, [currentIndex]);

  if (!currentFolder) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Folder title */}
      <EditableTitle
        title={currentFolder.name}
        onSave={(newName) => onRename(currentIndex, newName)}
        editable={editable}
      />

      {/* Images list */}
      <div className="flex flex-col divide-y divide-gray-800 max-h-[400px] overflow-y-auto">
        {currentFolder.media.map((m) => (
          <div key={m.id} className="flex h-16 items-center gap-4 py-2 px-1">
            <Image
              src={m.thumbnail_url || URL.createObjectURL(m.file)}
              alt={m.file.name}
              width={24}
              height={24}
              className="rounded object-cover"
            />
            <p className="text-sm truncate">{m.file.name}</p>
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
  currentIndex: number,
  folders: Folder[];
  onCancel: () => void;
  onUpload: (folders: Folder[], currentIndex: number, storageProvider: StorageProvider, selectedTenant?: string) => void;
  isNewUpload?: boolean;
}

export function FolderPreviewActions({
  currentIndex,
  folders,
  onCancel,
  onUpload,
  isNewUpload = true,
}: FolderPreviewActionsProps) {
  const { tenants, currentTenant } = useTenants();
  const { user } = useAuth();
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("b2");
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(
    currentTenant?.tenant_id
  );
  const [isTenantProject, setIsTenantProject] = useState<boolean>(!!currentTenant || false)

  return (
    <div className="flex flex-col w-full">
      {/* Tenant Select */}
      {!!tenants?.length && isNewUpload && (
        <div className="flex items-center mb-2 gap-2">
          <Switch
            checked={isTenantProject}
            onCheckedChange={(value) => {
              setSelectedTenant(undefined)
              setIsTenantProject(value)
            }}
          />
          <span className="text-sm text-muted-foreground">Add to Team</span>

          <AnimatePresence>
            {isTenantProject && (
              <motion.div
                key="tenant-select"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Select
                  value={selectedTenant}
                  onValueChange={(value) => setSelectedTenant(value)}
                >
                  <SelectTrigger variant="ghost" className="h-min w-48">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex w-full justify-between">
        {/* Left: Storage & Tenant Select */}
        <div className="flex items-center gap-2">
          {/* Storage Toggle */}
          {isNewUpload && (
            <>
              <Switch
                className="data-[state=checked]:bg-blue-200"
                checked={storageProvider === "dropbox"}
                disabled={!user?.dropbox?.access_token}
                onCheckedChange={(value) =>
                  setStorageProvider(value ? "dropbox" : "b2")
                }
              />
              <span className="text-sm text-muted-foreground">
                Use Dropbox Storage
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className={cn(
              storageProvider === "dropbox" && "bg-blue-200 hover:bg-blue-200/90"
            )}
            onClick={() =>
              onUpload(folders, currentIndex, storageProvider, selectedTenant)
            }
          >
            {isNewUpload
              ? `Upload ${folders.length > 1 ? `${folders.length} Folders` : "Folder"}`
              : "Add Files"}
          </Button>
        </div>
      </div>
    </div>
  );
}