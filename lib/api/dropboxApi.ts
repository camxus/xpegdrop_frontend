import type { DropboxUploadResponse } from "@/types";
import { api } from "./client";

export const dropboxApi = {
  getAuthUrl: async () => {
    return await api.get<{url: string}>("/dropbox/auth-url");
  },
};
