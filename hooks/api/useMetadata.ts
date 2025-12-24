"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metadataApi } from "@/lib/api/metadataApi";
import { EXIFData } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useMetadata() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all metadata for a project
  const getProjectMetadata = (projectId: string) =>
    useQuery({
      queryKey: ["metadata", projectId],
      queryFn: () => metadataApi.getProjectMetadata(projectId),
    });

  // Fetch metadata for a single image
  const getImageMetadata = (projectId: string, imageName: string) =>
    useQuery({
      queryKey: ["metadata", projectId, imageName],
      queryFn: () => metadataApi.getImageMetadata(projectId, imageName),
    });

  // Create metadata for a single image
  const createImageMetadata = useMutation({
    mutationFn: (data: {
      project_id: string;
      image_name: string;
      exif_data: EXIFData;
      image_hash?: string;
    }) => metadataApi.createImageMetadata(data),
    onSuccess: (data, variables) => {
      toast({
        title: "Metadata created",
        description: `Metadata for ${variables.image_name} was successfully created.`,
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
    mutationFn: (params: { project_id: string; image_name: string }) =>
      metadataApi.deleteImageMetadata(params.project_id, params.image_name),
    onSuccess: (_, variables) => {
      toast({
        title: "Metadata deleted",
        description: `Metadata for ${variables.image_name} was successfully deleted.`,
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
