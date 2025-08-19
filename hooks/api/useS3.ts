"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { extension as mimeExtension } from "mime-types";
import { api } from "@/lib/api/client";

const BATCH_SIZE = 5

type UploadFileOptions = {
  onProgress?: (progress: number) => void;
  key?: string;
  bucket?: string; // Optional override (defaults to temp bucket)
};

export function useS3() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, options?: UploadFileOptions) => {
    setIsUploading(true);
    setError(null);

    try {
      const ext = mimeExtension(file.type);
      if (!ext) {
        throw new Error("Unsupported file type");
      }

      // Construct S3 key
      const key = options?.key || `${uuidv4()}.${ext}`;
      const bucket = options?.bucket || process.env.NEXT_PUBLIC_TEMP_BUCKET;

      // 1️⃣ Request presigned URL (GET with query params)
      const data = await api.get("/auth/presign-url", {
        params: {
          bucket,
          key,
          content_type: file.type,
        },
      });

      const { upload_url } = data.data;

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

      setIsUploading(false);
      return { key, bucket };
    } catch (err: any) {
      console.error("S3 Upload error:", err);
      setError(err.message || "Upload failed");
      setIsUploading(false);
      throw err;
    }
  };

  const uploadFiles = async (files: File[], options?: UploadFileOptions) => {
    const results: any[] = [];
    const batchSize = BATCH_SIZE;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      // Wait for this batch to complete before starting the next
      const batchResults = await Promise.all(batch.map((file) => uploadFile(file, options)));
      results.push(...batchResults);
    }

    return results;
  };

  return { uploadFile, uploadFiles, isUploading, error };
}
