import { api } from "./client";

export interface GoogleStorageStats {
  used: number;
  allocated: number;
  used_percent: number;
}

export const googleApi = {
  /**
   * Step 1: Get Google OAuth URL
   * GET /google/auth-url
   */
  getAuthUrl: async () => {
    return await api.get<{ url: string }>("/google/auth-url");
  },

  /**
   * Step 3: Google OAuth callback + link account
   * GET /google/callback/link
   */
  linkCallback: async (params: { code: string; state: string }) => {
    return await api.get("/google/callback/link", { params });
  },

  /**
   * Step 4: Get Google Drive storage stats
   * GET /google/stats
   */
  getStats: async () => {
    return await api.get<GoogleStorageStats>("/google/stats");
  },
};