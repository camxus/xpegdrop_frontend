"use client";

import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { extension as mimeExtension } from "mime-types";
import { api } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react"; // retry icon

const BATCH_SIZE = 5;

type UploadFileOptions = {
  onProgress?: (progress: number) => void;
  key?: string;
  bucket?: string; // Optional override (defaults to temp bucket)
};

type FileProgress = {
  file: File;
  name: string;
  percent: number;
  status: "uploading" | "done" | "failed";
};

export function useS3() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadSingleFile = async (file: File, options?: UploadFileOptions) => {
    setIsUploading(true)
    await uploadFile(file, options);
    setIsUploading(false)
    toast({
      title: "Upload successful",
      description: `${file.name} uploaded successfully.`,
    });
  };

  const uploadFile = async (file: File, options?: UploadFileOptions) => {
    setIsUploading(true);
    setError(null);

    try {
      const ext = mimeExtension(file.type);
      if (!ext) {
        throw new Error("Unsupported file type");
      }

      const key = options?.key || `${uuidv4()}/${file.name}`;
      const bucket = options?.bucket || process.env.NEXT_PUBLIC_TEMP_BUCKET;

      const { upload_url } = await api.get("/auth/presign-url", {
        params: { bucket, key, content_type: file.type },
        withCredentials: false,
      });

      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percent);
          }
        },
      });

      setIsUploading(false);
      return { key, bucket };
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || "Upload failed");
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred while uploading.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const uploadFiles = async (files: File[], options?: UploadFileOptions) => {
    const toastId = uuidv4();
    setIsUploading(true);
    setError(null);

    let progressState: FileProgress[] = files.map((f) => ({
      file: f,
      name: f.name,
      percent: 0,
      status: "uploading",
    }));

    const { update, dismiss } = toast({
      title: "Uploading files...",
      description: renderFiles(progressState, retryFile),
      duration: Infinity,
    });

    const updateToastUI = () => {
      update({
        title: "Uploading files...",
        description: renderFiles(progressState, retryFile),
        id: toastId,
      });
    };

    async function retryFile(file: File, index: number) {
      progressState[index].status = "uploading";
      progressState[index].percent = 0;
      updateToastUI();

      try {
        await uploadFile(file, {
          ...options,
          onProgress: (percent) => {
            progressState[index].percent = percent;
            updateToastUI();
          },
        });
        progressState[index].status = "done";
        progressState[index].percent = 100;
      } catch {
        progressState[index].status = "failed";
        progressState[index].percent = 100; // fill bar on fail
      }
      updateToastUI();
    }

    try {
      const results: any[] = [];
      const batchSize = BATCH_SIZE;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map((file, idx) => {
            const realIndex = i + idx;
            return uploadFile(file, {
              ...options,
              onProgress: (percent) => {
                progressState[realIndex].percent = percent;
                updateToastUI();
              },
            })
              .then((res) => {
                progressState[realIndex].status = "done";
                progressState[realIndex].percent = 100;
                updateToastUI();
                return res;
              })
              .catch(() => {
                progressState[realIndex].status = "failed";
                progressState[realIndex].percent = 100; // show red full bar
                updateToastUI();
              });
          })
        );

        results.push(...batchResults);
      }

      if (progressState.every((f) => f.status === "done")) {
        update({
          title: "Upload complete",
          description: renderFiles(progressState, retryFile),
          id: toastId,
        });
        setTimeout(() => dismiss(), 2000);
      } else {
        update({
          title: "Some uploads failed",
          description: renderFiles(progressState, retryFile),
          id: toastId,
        });
      }

      setIsUploading(false);
      return results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setIsUploading(false);

      update({
        title: "Upload failed",
        description: renderFiles(progressState, retryFile),
        id: toastId,
      });

      throw err;
    }
  };

  return { uploadFile: uploadSingleFile, uploadFiles, isUploading, error };
}

// 👇 Helper: render file list with progress + retry icon
function renderFiles(
  progressState: FileProgress[],
  retryFile: (file: File, index: number) => void
) {
  return (
    <div className="space-y-3">
      {progressState.map((file, idx) => {
        const isFailed = file.status === "failed";
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <p
                className={`text-sm ${
                  isFailed ? "text-red-300 font-medium" : ""
                }`}
              >
                {file.name} ({file.percent}%)
              </p>
              {isFailed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => retryFile(file.file, idx)}
                >
                  <RotateCcw className="h-4 w-4 text-red-300" />
                </Button>
              )}
            </div>
            <Progress
              value={file.percent}
              className={`h-0.5 w-full ${isFailed ? "[&>div]:bg-red-300" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
}
