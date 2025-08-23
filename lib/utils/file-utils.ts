import type { ImageFile, Folder } from "@/types"

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function getImageFiles(files: File[]): File[] {
  return files.filter(isImageFile)
}

export function createImageFile(file: File, folder: string): ImageFile {
  return {
    id: `${folder}-${file.name}-${Date.now()}`,
    name: file.name,
    url: URL.createObjectURL(file),
    file,
    folder,
  }
}

export function processFolderUpload(files: File[]): Folder[] {
  const folderMap = new Map<string, File[]>()

  files.forEach((file) => {
    if (!isImageFile(file)) return

    const getFolderName = (file: any) => {
      const rel = file.relativePath || file.webkitRelativePath || "";
      const parts = rel.split("/").filter(Boolean);
      return parts.length ? parts[0] : "Untitled Folder";
    };

    // Use relativePath instead of webkitRelativePath
    const folderName = getFolderName(file)

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, [])
    }
    folderMap.get(folderName)!.push(file)
  })

  return Array.from(folderMap.entries()).map(([folderName, folderFiles]) => ({
    id: `folder-${folderName}-${Date.now()}`,
    name: folderName,
    images: folderFiles.map((file) => createImageFile(file, folderName)),
    createdAt: new Date(),
  }))
}