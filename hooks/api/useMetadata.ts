"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metadataApi } from "@/lib/api/metadataApi";
import { EXIFData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { isImageFile } from "@/lib/utils/file-utils";

export function useMetadata() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all metadata for a project
  const getProjectMetadata = (projectId: string) =>
    useQuery({
      queryKey: ["metadata", projectId],
      queryFn: () => metadataApi.getProjectMetadata(projectId),
      enabled: !!projectId
    });

  // Fetch metadata for a single image
  const getImageMetadata = (projectId: string, file: File) =>
    useQuery({
      queryKey: ["metadata", projectId, file.name],
      queryFn: () => metadataApi.getImageMetadata(projectId, file.name),
      enabled: isImageFile(file)
    });

  // Create metadata for a single image
  const createImageMetadata = useMutation({
    mutationFn: (data: {
      project_id: string;
      media_name: string;
      exif_data: EXIFData;
      media_hash?: string;
    }) => metadataApi.createImageMetadata(data),
    onSuccess: (data, variables) => {
      toast({
        title: "Metadata created",
        description: `Metadata for ${variables.media_name} was successfully created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["metadata", variables.project_id] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error?.message || "Failed to create metadata.",
        variant: "destructive",
      });
    },
  });

  // Batch create metadata for multiple images
  const batchCreateImageMetadata = useMutation({
    mutationFn: (data: { project_id: string; file_metadata: Record<string, EXIFData> }) =>
      metadataApi.batchCreateImageMetadata(data),
    onSuccess: (data, variables) => {
      toast({
        title: "Metadata batch created",
        description: `${Object.keys(variables.file_metadata).length} images metadata added.`,
      });
      queryClient.invalidateQueries({ queryKey: ["metadata", variables.project_id] });
    },
    onError: (error: any) => {
      toast({
        title: "Batch creation failed",
        description: error?.message || "Failed to create batch metadata.",
        variant: "destructive",
      });
    },
  });

  // Delete metadata for a single image
  const deleteImageMetadata = useMutation({
    mutationFn: (params: { project_id: string; media_name: string }) =>
      metadataApi.deleteImageMetadata(params.project_id, params.media_name),
    onSuccess: (_, variables) => {
      toast({
        title: "Metadata deleted",
        description: `Metadata for ${variables.media_name} was successfully deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["metadata", variables.project_id] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error?.message || "Failed to delete metadata.",
        variant: "destructive",
      });
    },
  });

  return {
    getProjectMetadata,
    getImageMetadata,
    createImageMetadata,
    batchCreateImageMetadata,
    deleteImageMetadata,
  };
}
