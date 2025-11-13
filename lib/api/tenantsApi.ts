import { api } from "./client";

export interface S3Location {
  bucket: string;
  key: string;
  url?: string;
}

export interface Tenant {
  tenant_id: string;
  hanlde: string;
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
   * Update a tenant (admin only)
   */
  updateTenant: async (
    tenantId: string,
    data: { name?: string; description?: string; avatar?: S3Location | string }
  ) => {
    return await api.put<Tenant>(`/tenants/${tenantId}`, data);
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
    data: { user_id: string; role?: "admin" | "member" | "viewer" }
  ) => {
    return await api.post<{ message: string; tenant: Tenant }>(
      `/tenants/${tenantId}/invite`,
      data
    );
  },

  /**
   * Remove a member from the tenant (admin only)
   */
  removeMember: async (tenantId: string, userId: string) => {
    return await api.delete<{ message: string; tenant: Tenant }>(
      `/tenants/${tenantId}/members/${userId}`
    );
  },
};
