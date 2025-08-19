"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { extension as mimeExtension } from "mime-types";
import { api } from "@/lib/api/client";

type UploadFileOptions = {
  onProgress?: (progress: number) => void;
  bucket?: string; // Optional override (defaults to temp bucket)
};

export function useS3() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, options?: UploadFileOptions) => {
    setUploading(true);
    setError(null);

    try {
      const ext = mimeExtension(file.type);
      if (!ext) {
        throw new Error("Unsupported file type");
      }

      // Construct S3 key
      const key = `temp_uploads/${uuidv4()}.${ext}`;
      const bucket = options?.bucket || process.env.NEXT_PUBLIC_TEMP_BUCKET;

      // 1️⃣ Request presigned URL (GET with query params)
      const data = await api.get("/auth/presign-url", {
        params: {
          bucket,
          key,
          content_type: file.type,
        },
      });

      const { upload_url } = data;

      // 2️⃣ Upload file to S3 using presigned URL
      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(percent);
          }
        },
      });

      setUploading(false);
      return { key, bucket };
    } catch (err: any) {
      console.error("S3 Upload error:", err);
      setError(err.message || "Upload failed");
      setUploading(false);
      throw err;
    }
  };
  
  const uploadFiles = async (files: File[], options?: UploadFileOptions) => {
    try {
      // Map each file to a promise from uploadFile
      const uploadPromises = files.map((file) => uploadFile(file, options));

      // Wait for all uploads to complete in parallel
      const results = await Promise.all(uploadPromises);

      return results; // Array of S3 keys or upload results
    } catch (err) {
      console.error("One or more uploads failed:", err);
      throw err; // rethrow to handle in caller
    }
  };

  return { uploadFile, uploadFiles, uploading, error };
}
