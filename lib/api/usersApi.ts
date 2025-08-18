import { api } from "./client";

export const userApi = {
  // 🔐 Get current authenticated user
  getCurrentUser: async () => {
    return await api.get("/users/");
  },

  // 👤 Get user by ID (or fallback to current user)
  getUserById: async (userId?: string) => {
    return await api.get(`/users/${userId || ""}`);
  },

  // 🔍 Get user by username (public profile)
  getUserByUsername: async (username: string) => {
    return await api.get(`/users/username/${username}`);
  },

  // ✏️ Update current user (with avatar optional)
  updateUser: async (formData: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    avatar?: File | null;
    dropbox?: { access_token: string; refresh_token?: string };
  }) => {
    const data = new FormData();

    for (const key in formData) {
      const value = formData[key as keyof typeof formData];

      if (key === "avatar" && value instanceof File) {
        data.append("avatar", value);
      } else if (key === "dropbox") {
        data.append("dropbox", JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        data.append(key, value as string);
      }
    }

    return await api.put("/users", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 🔒 Update Dropbox tokens (safe endpoint)
  updateDropboxToken: async (dropbox: {
    access_token: string;
    refresh_token?: string;
  }) => {
    return await api.put("/users/dropbox", { dropbox });
  },

  // ❌ Delete current user
  deleteUser: async () => {
    return await api.delete("/users");
  },
};
