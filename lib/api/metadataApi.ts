import { Metadata } from "@/types/metadata";
import { api } from "./client";
import { EXIFData } from "@/types";

/**
 * Metadata API client
 */
export const metadataApi = {
  /**
   * Create metadata for a single image
   */
  createImageMetadata: async (data: {
    project_id: string;
    media_name: string;
    exif_data: EXIFData;
    media_hash?: string;
  }) => {
    return await api.post("/metadata", data);
  },

  /**
   * Batch create metadata for multiple images in a project
   */
  batchCreateImageMetadata: async (data: {
    project_id: string;
    file_metadata: Record<string, EXIFData | null>;
  }) => {
    return await api.post("/metadata/batch", data);
  },

  /**
   * Get metadata for a single image
   */
  getImageMetadata: async (project_id: string, media_name: string) => {
    return await api.get<Metadata>(`/metadata/${project_id}/${encodeURIComponent(media_name)}`);
  },

  /**
   * Get all metadata for a project
   */
  getProjectMetadata: async (project_id: string) => {
    return await api.get<Metadata[]>(`/metadata/${project_id}`);
  },

  /**
   * Delete metadata for a single image
   */
  deleteImageMetadata: async (project_id: string, media_name: string) => {
    return await api.delete(`/metadata/${project_id}/${encodeURIComponent(media_name)}`);
  },
};
