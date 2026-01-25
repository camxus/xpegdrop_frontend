"use client";

import { useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import jsPDF from "jspdf";
import type { MediaFile } from "@/types";
import { Project } from "@/types/project";
import { isImageFile, isVideoFile } from "@/lib/utils/file-utils";

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

  // --------------------
  // Single file
  // --------------------
  const downloadSingleFile = async (file: DownloadFile) => {
    setIsDownloading(true);
    await downloadFile(file);
    setIsDownloading(false);
    toast({
      title: "Download successful",
      description: `${file.name} downloaded successfully.`,
    });
  };

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

  // --------------------
  // Multiple files as ZIP
  // --------------------
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
    const folderZip = zip.folder(zipName) || zip;

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
        folderZip.file(file.name, response.data);
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
      if (progressState.every((item) => item.status === "done")) {
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

  // --------------------
  // Download Folder as PDF
  // --------------------
  const downloadFolderPDF = async (
    project: Project,
    media: (MediaFile & {
      preview_url: string;
      full_file_url: string;
    })[]
  ) => {
    setIsDownloading(true);
    setError(null);

    try {
      // 1️⃣ Contact Sheet (Landscape)
      let doc = new jsPDF({ unit: "px", format: "a4", orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const spacing = 5;

      // Title
      doc.setFontSize(18);
      doc.text(`${project.name} - Contact Sheet`, pageWidth / 2, 20, { align: "center" });

      let x = margin;
      let y = 40;
      const thumbSize = 60;

      for (const m of media) {
        if (!m.thumbnail_url) continue;

        try {
          doc.addImage(m.thumbnail_url, "JPEG", x, y, thumbSize, thumbSize);
        } catch { }

        x += thumbSize + spacing;
        if (x + thumbSize > pageWidth - margin) {
          x = margin;
          y += thumbSize + spacing;

          if (y + thumbSize > pageHeight - margin) {
            doc.addPage("a4", "landscape"); // Keep contact sheet pages landscape
            y = margin;
          }
        }
      }

      // Media Pages (Portrait or Landscape depending on media)
      for (const m of media) {
        // Determine media orientation
        let imgWidth = 0;
        let imgHeight = 0;
        let orientation: "portrait" | "landscape" = "portrait";

        if (isImageFile(m.file) && m.full_file_url) {
          try {
            const img = await loadImage(m.full_file_url);
            orientation = img.width >= img.height ? "landscape" : "portrait";

            const docPageWidth = orientation === "landscape" ? 842 : 595; // px for A4
            const docPageHeight = orientation === "landscape" ? 595 : 842;
            doc.addPage("a4", orientation);

            const maxWidth = docPageWidth - margin * 2;
            const maxHeight = docPageHeight - margin * 2;

            if (img.width > img.height) {
              // scale to fit width
              imgWidth = Math.min(maxWidth, img.width);
              imgHeight = (img.height * imgWidth) / img.width;
            } else {
              // scale to fit height
              imgHeight = Math.min(maxHeight, img.height);
              imgWidth = (img.width * imgHeight) / img.height;
            }

            let xPos = margin;
            let yPos = margin;

            // Center image
            if (imgWidth < maxWidth) xPos += (maxWidth - imgWidth) / 2;
            if (imgHeight < maxHeight) yPos += (maxHeight - imgHeight) / 2;

            doc.addImage(m.full_file_url, "JPEG", xPos, yPos, imgWidth, imgHeight);

          } catch (err) { }
        } else if (isVideoFile(m.file)) {
          // For videos, use thumbnail orientation
          if (m.thumbnail_url) {
            try {
              const img = await loadImage(m.thumbnail_url);
              orientation = img.width >= img.height ? "landscape" : "portrait";
              doc.addPage("a4", orientation);

              const docPageWidth = orientation === "landscape" ? 842 : 595;
              const docPageHeight = orientation === "landscape" ? 595 : 842;
              const maxWidth = docPageWidth - margin * 2;
              const maxHeight = docPageHeight - margin * 2;

              imgWidth = Math.min(maxWidth, img.width);
              imgHeight = (img.height * imgWidth) / img.width;

              let xPos = margin + (maxWidth - imgWidth) / 2;
              let yPos = margin + 50; // leave space for title

              // Title
              doc.setFontSize(16);
              doc.text(m.name, docPageWidth / 2, 30, { align: "center" });

              // Add thumbnail
              doc.addImage(m.thumbnail_url, "JPEG", xPos, yPos, imgWidth, imgHeight);

              // Add link to project
              doc.setTextColor(0, 0, 255);
              doc.textWithLink("▶ Open Video in Project", docPageWidth / 2, yPos + imgHeight + 20, {
                url: project.share_url,
                align: "center",
              });
              doc.setTextColor(0, 0, 0);
            } catch { }
          }
        }
      }

      doc.save(`${project.name}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: `${project.name}.pdf downloaded successfully.`,
      });
    } catch (err: any) {
      setError(err.message || "PDF generation failed");
      toast({
        title: "PDF Download Failed",
        description: err.message || "Something went wrong generating the PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to load images
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });

  return { downloadFile: downloadSingleFile, downloadFiles, downloadFolderPDF, isDownloading, error };
}

// --------------------
// Helper to render file list with progress and retry button
// --------------------
function renderFiles(progressState: FileProgress[], retryFile: (file: DownloadFile, index: number) => void) {
  return (
    <div className="space-y-3">
      {progressState.map((file, idx) => {
        const isFailed = file.status === "failed";
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <p className={`text-sm ${isFailed ? "text-red-300 font-medium" : ""}`}>
                {file.file.name} ({file.percent}%)
              </p>
              {isFailed && (
                <Button variant="ghost" size="icon" onClick={() => retryFile(file.file, idx)}>
                  <RotateCcw className="h-4 w-4 text-red-300" />
                </Button>
              )}
            </div>
            <Progress value={file.percent} className={`h-0.5 w-full ${isFailed ? "[&>div]:bg-red-300" : ""}`} />
          </div>
        );
      })}
    </div>
  );
}
