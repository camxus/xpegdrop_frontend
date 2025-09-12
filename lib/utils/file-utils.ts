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

function isImageCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(false);  // loaded successfully → not corrupted
    img.onerror = () => resolve(true);  // failed to load → corrupted
    img.src = URL.createObjectURL(file);
  });
}

export async function processFolderUpload(files: File[]): Promise<Folder[]> {
  const folderMap = new Map<string, File[]>()
  for (const file of files) {
    if (!isImageFile(file)) continue;

    const corrupted = await isImageCorrupted(file);
    if (corrupted) {
      console.warn(`Corrupted image skipped: ${file.name}`);
      continue;
    }

    const getFolderName = (file: any) => {
      const rel = file.relativePath || file.webkitRelativePath || "";
      const parts = rel.split("/").filter(Boolean);
      if (parts[0] === ".") return "Untitled Folder";
      return parts.length ? parts[0] : "Untitled Folder";
    };

    const folderName = getFolderName(file);

    if (!folderMap.has(folderName)) {
      folderMap.set(folderName, []);
    }
    folderMap.get(folderName)!.push(file);
  }


  return Array.from(folderMap.entries()).map(([folderName, folderFiles]) => ({
    id: `folder-${folderName}-${Date.now()}`,
    name: folderName,
    images: folderFiles.map((file) => createImageFile(file, folderName)),
    createdAt: new Date(),
  }))
}

// Convert File -> Base64 string
export function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file); // includes mime type prefix
  });
}

// Convert Base64 string -> File and extract filename from embedded metadata
export function b64ToFile(base64: string): File {
  const arr = base64.split(",");
  const mimeMatch = arr[0].match(/data:(.*);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  // Extract embedded filename metadata if present: data:image/jpeg;name=BASE64;...
  const nameMatch = arr[0].match(/name=([^;]+)/);
  let filename = `file-${Date.now()}`; // fallback

  if (nameMatch) {
    try {
      // Decode Base64 name: "originalName:id"
      const decoded = atob(nameMatch[1]);
      const [originalName] = decoded.split(":");
      if (originalName) filename = originalName;
    } catch (err) {
      console.warn("Failed to decode filename from Base64 metadata", err);
    }
  }

  // Convert Base64 to binary
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
}

export async function urlToFile(url: string, filename = "thumbnail.jpg") {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}
