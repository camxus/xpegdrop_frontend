import type { DropboxUploadResponse } from "@/types";
import { api } from "./client";

export interface DropboxStorageStats {
  used: number;
  allocated: number;
  used_percent: number;
}

export const dropboxApi = {
  getAuthUrl: async () => {
    return await api.get<{ url: string }>("/dropbox/auth-url", { withCredentials: false });
  },

  getStats: async () => {
    return await api.get<DropboxStorageStats>("/dropbox/stats");
  },
};
