import { api } from "./client";

export interface S3Location {
  bucket: string;
  key: string;
  url?: string;
}

export interface Tenant {
  tenant_id: string;
  handle: string;
  name: string;
  description?: string;
  members: {
    user_id: string;
    role: "admin" | "editor" | "viewer";
    joined_at: string;
  }[];
  avatar?: S3Location | string;
  created_at: string;
  updated_at?: string;
}

export const tenantsApi = {
  /**
   * Create a new tenant
   */
  createTenant: async (data: { name: string; description?: string }) => {
    return await api.post<Tenant>("/tenants", data);
  },

  /**
   * Get all tenants for the authenticated user
   */
  getTenants: async () => {
    return await api.get<Tenant[]>("/tenants");
  },

  /**
   * Get a single tenant by ID
   */
  getTenant: async (tenantId: string) => {
    return await api.get<Tenant>(`/tenants/${tenantId}`);
  },

  /**
   * Get a single tenant by handle
   */
  getTenantByHandle: async (handle: string) => {
    return await api.get<Tenant>(`/tenants/handle/${handle}`);
  },

  /**
   * Update a tenant (admin only)
   *
   * Supports:
   * - name (string)
   * - description (string)
   * - avatar (File OR S3Location JSON)
   */
  updateTenant: async (
    tenantId: string,
    formData: {
      name?: string;
      description?: string;
      avatar?: File | S3Location | null;
    }
  ) => {
    const data = new FormData();

    for (const key in formData) {
      const value = formData[key as keyof typeof formData];

      // Handle avatar upload
      if (key === "avatar") {
        if (value instanceof File) {
          data.append("avatar", value);
        } else if (value && typeof value === "object") {
          // S3Location object → send as JSON
          data.append("avatar", JSON.stringify(value));
        }
        continue;
      }

      // Regular fields
      if (value !== undefined && value !== null) {
        data.append(key, value as string);
      }
    }

    return await api.put<Tenant>(`/tenants/${tenantId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Delete a tenant (admin only)
   */
  deleteTenant: async (tenantId: string) => {
    return await api.delete<{ message: string }>(`/tenants/${tenantId}`);
  },

  /**
   * Invite a new member to the tenant
   */
  inviteMember: async (
    tenantId: string,
    data: { user_id: string; role?: "admin" | "editor" | "viewer" }
  ) => {
    return await api.post<{ message: string; tenant: Tenant }>(
      `/tenants/${tenantId}/invite`,
      data
    );
  },

  /**
   * Update a member's role
   */
  updateMember: async (tenantId: string, userId: string, role: "admin" | "editor" | "viewer") => {
    return await api.patch<{ message: string; tenant: Tenant }>(
      `/tenants/${tenantId}/${userId}`,
      { role }
    );
  },

  /**
   * Remove a member from the tenant (admin only)
   */
  removeMember: async (tenantId: string, userId: string) => {
    return await api.delete<{ message: string; tenant: Tenant }>(
      `/tenants/${tenantId}/${userId}`
    );
  },
};
