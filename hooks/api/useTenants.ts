"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantsApi, Tenant, S3Location, CreateTenantDto } from "@/lib/api/tenantsApi";
import { useToast } from "../use-toast";
import { useAuth } from "./useAuth";
import { User } from "@/types/user";

export function useTenants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Fetch all tenants for the authenticated user
   */
  const tenantsQuery = useQuery({
    queryKey: ["tenants", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      return await tenantsApi.getTenants();
    },
    enabled: !!user?.user_id,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  /**
   * Fetch a single tenant by ID
   */
  const getTenant = (tenantId: string) =>
    useQuery({
      queryKey: ["tenant", tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID is required");
        return await tenantsApi.getTenant(tenantId);
      },
      enabled: !!tenantId,
      staleTime: 1000 * 60 * 5, // cache for 5 minutes
    });

  /**
   * Fetch a single tenant by ID
   */
  const getTenantByHandle = useMutation<Tenant, Error, string>({
    mutationFn: (handle: string) => tenantsApi.getTenantByHandle(handle),
  });


  /**
   * Create tenant
   */
  const createTenant = useMutation({
    mutationFn: async (payload: CreateTenantDto) => {
      if (!user?.user_id) throw new Error("User not logged in");
      return await tenantsApi.createTenant(payload);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Tenant[]>(["tenants", user?.user_id], (old) =>
        old ? [...old, data] : [data]
      );
      toast({
        title: "Team created",
        description: `Team "${data.name}" was created successfully.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to create tenant.",
        variant: "destructive",
      });
    },
  });

  /**
  * Update tenant
  */
  const updateTenant = useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: {
        name?: string;
        description?: string;
        avatar?: File | S3Location | null;
      };
    }) => {
      // Pass through to real API (multipart/form-data)
      return tenantsApi.updateTenant(tenantId, data);
    },

    onSuccess: (updatedTenant) => {
      // Update tenant list cache
      queryClient.setQueryData<Tenant[]>(
        ["tenants", user?.user_id],
        (old) => {
          if (!old) return [updatedTenant];
          return old.map((t) =>
            t.tenant_id === updatedTenant.tenant_id ? updatedTenant : t
          );
        }
      );

      toast({
        title: "Team updated",
        description: "Your team was updated successfully.",
      });
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.error || "Failed to update tenant.",
        variant: "destructive",
      });
    },
  });


  /**
   * Delete tenant
   */
  const deleteTenant = useMutation({
    mutationFn: async (tenantId: string) => tenantsApi.deleteTenant(tenantId),
    onSuccess: (_, tenantId) => {
      queryClient.setQueryData<Tenant[]>(["tenants", user?.user_id], (old) =>
        old ? old.filter((t) => t.tenant_id !== tenantId) : []
      );
      toast({
        title: "Team deleted",
        description: "Team was deleted successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to delete team.",
        variant: "destructive",
      });
    },
  });

  /**
   * Invite member
   */
  const inviteMember = useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: { user_id: string; role?: "admin" | "editor" | "viewer" };
    }) => tenantsApi.inviteMember(tenantId, data),
    onSuccess: ({ tenant }) => {
      queryClient.setQueryData<Tenant[]>(["tenants", user?.user_id], (old) =>
        old
          ? old.map((t) => (t.tenant_id === tenant.tenant_id ? tenant : t))
          : [tenant]
      );
      toast({
        title: "Member invited",
        description: "The user has been added to your team.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to invite member.",
        variant: "destructive",
      });
    },
  });

  /**
 * Update member role
 */
  const updateMember = useMutation({
    mutationFn: async ({
      tenantId,
      userId,
      role,
    }: {
      tenantId: string;
      userId: string;
      role: "admin" | "editor" | "viewer";
    }) => tenantsApi.updateMember(tenantId, userId, role),
    onSuccess: ({ tenant }) => {
      queryClient.setQueryData<Tenant[]>(["tenants", user?.user_id], (old) =>
        old
          ? old.map((t) => (t.tenant_id === tenant.tenant_id ? tenant : t))
          : [tenant]
      );
      toast({
        title: "Member updated",
        description: "The member's role was updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to update member.",
        variant: "destructive",
      });
    },
  });

  /**
   * Remove member
   */
  const removeMember = useMutation({
    mutationFn: async ({
      tenantId,
      userId,
    }: {
      tenantId: string;
      userId: string;
    }) => tenantsApi.removeMember(tenantId, userId),
    onSuccess: ({ tenant }) => {
      queryClient.setQueryData<Tenant[]>(["tenants", user?.user_id], (old) =>
        old
          ? old.map((t) => (t.tenant_id === tenant.tenant_id ? tenant : t))
          : [tenant]
      );
      toast({
        title: "Member removed",
        description: "The member was removed from the team.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to remove member.",
        variant: "destructive",
      });
    },
  });

  // Get user by public username
  const searchByUsername = useMutation<User[], Error, { tenantId: string; query: string }>({
    mutationFn: ({ tenantId, query }) => tenantsApi.searchTenantUsers(tenantId, query),
    onError: (err) => {
      console.error("Search tenant users error:", err);
    },
  });

  return {
    tenants: tenantsQuery.data ?? [],
    isLoading: tenantsQuery.isLoading,
    getTenant,
    getTenantByHandle,
    searchByUsername,
    createTenant,
    updateTenant,
    deleteTenant,
    inviteMember,
    updateMember,
    removeMember,
  };
}
