import { ShareModeShort, Share, ShareMode } from "@/types/share";
import { api } from "./client";

export const sharesApi = {
  // Create a new share
  createShare: async (data: {
    project_id: string;
    mode: ShareMode;
    approved_users?: Share["approved_users"];
    approved_emails?: Share["approved_emails"];
    is_public?: boolean;
    can_download?: boolean;
    expires_at?: string;
  }) => {
    return await api.post<Share>("/shares", data);
  },

  // Get a share by ID and mode ('c' for collaborative, 'p' for presentation)
  getShareById: async (shareId: string, mode: ShareModeShort) => {
    return await api.get<Share>(`/shares/${shareId}/${mode}`);
  },

  // Update a share
  updateShare: async (shareId: string, updates: Partial<Share>) => {
    return await api.put(`/shares/${shareId}`, updates);
  },

  // Delete a share
  deleteShare: async (shareId: string) => {
    return await api.delete(`/shares/${shareId}`);
  },

  // List all shares for a given project
  listSharesByProject: async (projectId: string) => {
    return await api.get<Share[]>(`/shares/project/${projectId}`);
  },
};