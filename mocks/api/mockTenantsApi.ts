
import { User } from "@/types/user";
import { mockTenants } from "@/mocks/tenants";
import { mockUsers } from "@/mocks/users";
import { CreateTenantDto, Member, Tenant } from "@/lib/api/tenantsApi";

/**
 * Local mutable state to simulate a backend
 */
let tenants: Tenant[] = [...mockTenants];

export const mockTenantsApi = {
  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    const newTenant: Tenant = {
      tenant_id: `tenant_${crypto.randomUUID()}`,
      handle: data.handle,
      name: data.name,
      description: data.description,
      avatar: data.avatar as unknown as string ?? undefined,
      members: data.members ?? [],
      created_at: new Date().toISOString(),
      created_by: data.members?.[0]?.user_id ?? "user_1",
    };

    tenants.push(newTenant);
    return newTenant;
  },

  /**
   * Get all tenants for the authenticated user
   */
  async getTenants(): Promise<Tenant[]> {
    return tenants;
  },

  /**
   * Get a single tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");
    return tenant;
  },

  /**
   * Get a single tenant by handle
   */
  async getTenantByHandle(handle: string): Promise<Tenant> {
    const tenant = tenants.find(t => t.handle === handle);
    if (!tenant) throw new Error("Tenant not found");
    return tenant;
  },

  /**
   * Update a tenant (admin only)
   */
  async updateTenant(
    tenantId: string,
    formData: {
      name?: string;
      description?: string;
      avatar?: File | any | null;
    }
  ): Promise<Tenant> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    if (formData.name !== undefined) tenant.name = formData.name;
    if (formData.description !== undefined)
      tenant.description = formData.description;

    if (formData.avatar !== undefined && formData.avatar !== null) {
      tenant.avatar =
        formData.avatar instanceof File
          ? URL.createObjectURL(formData.avatar)
          : formData.avatar;
    }

    tenant.updated_at = new Date().toISOString();
    return tenant;
  },

  /**
   * Delete a tenant (admin only)
   */
  async deleteTenant(tenantId: string): Promise<{ message: string }> {
    tenants = tenants.filter(t => t.tenant_id !== tenantId);
    return { message: "Tenant deleted" };
  },

  /**
   * Invite a new member to the tenant
   */
  async inviteMember(
    tenantId: string,
    data: { user_id: string; role?: "admin" | "editor" | "viewer" }
  ): Promise<{ message: string; tenant: Tenant }> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    const alreadyMember = tenant.members.some(
      m => m.user_id === data.user_id
    );
    if (alreadyMember) throw new Error("User already member");

    tenant.members.push(
      new Member(data.user_id, data.role ?? "viewer", new Date().toISOString())
    );

    tenant.updated_at = new Date().toISOString();
    return { message: "Member invited", tenant };
  },

  /**
   * Update a member's role
   */
  async updateMember(
    tenantId: string,
    userId: string,
    role: "admin" | "editor" | "viewer"
  ): Promise<{ message: string; tenant: Tenant }> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    const member = tenant.members.find(m => m.user_id === userId);
    if (!member) throw new Error("Member not found");

    member.role = role;
    tenant.updated_at = new Date().toISOString();

    return { message: "Role updated", tenant };
  },

  /**
   * Remove a member from the tenant
   */
  async removeMember(
    tenantId: string,
    userId: string
  ): Promise<{ message: string; tenant: Tenant }> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    tenant.members = tenant.members.filter(m => m.user_id !== userId);
    tenant.updated_at = new Date().toISOString();

    return { message: "Member removed", tenant };
  },

  /**
   * Search users in a tenant by username
   */
  async searchTenantUsers(
    tenantId: string,
    query: string
  ): Promise<User[]> {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) throw new Error("Tenant not found");

    return mockUsers.filter(
      u =>
        tenant.members.some(m => m.user_id === u.user_id) &&
        u.username.toLowerCase().includes(query.toLowerCase())
    );
  },
};
