"use client";

import { useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type DownloadFile = {
  name: string;
  url: string;
};

type FileProgress = {
  file: DownloadFile;
  percent: number;
  status: "downloading" | "done" | "failed";
};

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const downloadSingleFile = async (file: DownloadFile) => {
    setIsDownloading(true);
    await downloadFile(file);
    setIsDownloading(false);
    toast({
      title: "Download successful",
      description: `${file.name} downloaded successfully.`,
    });
  };

  // Single file download
  const downloadFile = async (file: DownloadFile) => {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await axios.get(file.url, { responseType: "blob" });
      saveAs(response.data, file.name);
    } catch (err: any) {
      setError(err.message || "Download failed");
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadFiles = async (files: DownloadFile[], zipName: string) => {
    if (!files.length) return;

    setIsDownloading(true);
    setError(null);

    const progressState: FileProgress[] = files.map((f) => ({
      file: f,
      percent: 0,
      status: "downloading",
    }));

    const toastId = crypto.randomUUID();

    const { update, dismiss } = toast({
      title: "Downloading files...",
      description: renderFiles(progressState, retryFile),
      duration: Infinity,
    });

    const updateToastUI = () => {
      update({
        title: "Downloading files...",
        description: renderFiles(progressState, retryFile),
        id: toastId,
      });
    };

    async function retryFile(file: DownloadFile, index: number) {
      progressState[index].status = "downloading";
      progressState[index].percent = 0;
      updateToastUI();

      try {
        await downloadFile(file);
        progressState[index].status = "done";
        progressState[index].percent = 100;
      } catch {
        progressState[index].status = "failed";
        progressState[index].percent = 100;
      }

      updateToastUI();
    }

    const zip = new JSZip();
    const folder = zip.folder(zipName) || zip;

    const downloadFileToZip = async (file: DownloadFile, index: number) => {
      try {
        const response = await axios.get(file.url, {
          responseType: "blob",
          onDownloadProgress: (event) => {
            if (event.total) {
              progressState[index].percent = Math.round(
                (event.loaded * 100) / event.total
              );
              updateToastUI();
            }
          },
        });
        folder.file(file.name, response.data);
      } catch (err) {
        throw err;
      }
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          await downloadFileToZip(file, i);
          progressState[i].status = "done";
          progressState[i].percent = 100;
        } catch {
          progressState[i].status = "failed";
          progressState[i].percent = 100;
        }
        updateToastUI();
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${zipName}.zip`);
      
      update({
        title: "Download complete",
        description: renderFiles(progressState, retryFile),
        id: toastId,
      });
      if (progressState.every(item => item.status === 'done')) {
        setTimeout(() => dismiss(), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Download failed");
      update({
        title: "Download failed",
        description: renderFiles(progressState, retryFile),
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadFile: downloadSingleFile, downloadFiles, isDownloading, error };
}

// Helper to render file list with progress and retry button
function renderFiles(
  progressState: FileProgress[],
  retryFile: (file: DownloadFile, index: number) => void
) {
  return (
    <div className="space-y-3">
      {progressState.map((file, idx) => {
        const isFailed = file.status === "failed";
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <p
                className={`text-sm ${isFailed ? "text-red-300 font-medium" : ""
                  }`}
              >
                {file.file.name} ({file.percent}%)
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
