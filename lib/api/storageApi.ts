import { api } from "./client";

export interface StorageStats {
  used: number;
  allocated: number;
  used_percent: number;
}

export const storageApi = {
  /**
   * Fetch Backblaze storage usage for the current user
   */
  getStats: async () => {
    return await api.get<StorageStats>("/storage/stats");
  },
};
