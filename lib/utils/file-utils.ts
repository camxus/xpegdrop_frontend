import type { MediaFile, Folder } from "@/types"
import * as UTIF from "utif";
import * as exifr from "exifr";

const unsupportedButValid = ['image/tiff', 'image/heic', 'image/heif'];


export function isMediaFile(file: File): boolean {
  return isImageFile(file) || isVideoFile(file)
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/")
}

export function getMediaFiles(files: File[]): File[] {
  return files.filter(isMediaFile)
}

export async function createMediaFile(file: File, folder: string): Promise<MediaFile> {
  return {
    id: `${folder}-${file.name}-${Date.now()}`,
    name: file.name,
    type: file.type,
    thumbnail_url: isVideoFile(file) ? await generateVideoThumbnailURL(file) : (unsupportedButValid.includes(file.type) ? await getTiffPreviewURL(file) : URL.createObjectURL(file)),
    file,
    folder,
    metadata: isImageFile(file) ? await getEXIFData(file) : null
  }
}

function isCorruptedImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {

    // These formats aren't corrupted — they're just not displayable by browsers
    if (unsupportedButValid.includes(file.type)) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(false); // loaded successfully → not corrupted
    img.onerror = () => resolve(true); // failed to load → corrupted
    img.src = URL.createObjectURL(file);
  });
}

function isCorruptedVideo(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };
    
    video.preload = "metadata";
    
    video.onloadedmetadata = () => {
      // 🚨 critical guard
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        cleanup();
        resolve(true);
        return;
      }
      
      cleanup();
      resolve(false);
    };
    
    video.onerror = () => {
      cleanup();
      resolve(true);
    };
    
    video.src = url;
  });
}

export async function processFolderUpload(files: File[]): Promise<Folder[]> {
  const folderMap = new Map<string, File[]>()
  for (const file of files) {
    if (!isMediaFile(file)) continue;

    if (
      (isImageFile(file) && (await isCorruptedImage(file))) ||
      (isVideoFile(file) && (await isCorruptedVideo(file)))
    ) {
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



  return await Promise.all(
    Array.from(folderMap.entries()).map(async ([folderName, folderFiles]) => ({
      id: `folder-${folderName}-${Date.now()}`,
      name: folderName,
      media: await Promise.all(
        folderFiles.map((file) => createMediaFile(file, folderName))
      ),
      createdAt: new Date(),
    }))
  );
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

export async function getTiffPreviewURL(file: File) {
  const buffer = await file.arrayBuffer()
  const [ifd] = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifd);
  const rgba = UTIF.toRGBA8(ifd);

  // Create a canvas and draw
  const canvas = document.createElement("canvas");
  canvas.width = ifd.width;
  canvas.height = ifd.height;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL("image/png");
}


// Get EXIF data from a File
export async function getEXIFData(file: File): Promise<Record<string, any> | null> {
  try {
    if (!file.type.startsWith("image/")) return null;
    const exif = await exifr.parse(file);
    return exif || null;
  } catch (err) {
    console.warn(`Failed to extract EXIF data from ${file.name}`, err);
    return null;
  }
}

export async function generateVideoThumbnailURL(file: File): Promise<string> {
  if (!isVideoFile(file)) {
    throw new Error(`File must be of type "video/*"`)
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject("Canvas not supported");
      return;
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Avoid black frame
      video.currentTime = Math.min(0.1, video.duration || 0.1);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailURL = canvas.toDataURL("image/jpeg", 0.85);

      URL.revokeObjectURL(video.src);
      resolve(thumbnailURL);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject("Failed to generate video thumbnail");
    };
  });
}
