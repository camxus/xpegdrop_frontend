import { Member, Tenant } from "@/lib/api/tenantsApi";


export const mockTenants: Tenant[] = [
  {
    tenant_id: "tenant_agency_1",
    handle: "north-star-agency",
    name: "North Star Agency",
    description: "Creative studio for music, film & digital products",
    avatar: "https://i.pravatar.cc/150?img=8",

    created_at: "2025-01-05T10:00:00.000Z",
    created_by: "user_1",

    members: [
      new Member("user_1", "admin", "2025-01-05T10:00:00.000Z"),
      new Member("user_2", "editor", "2025-01-06T12:00:00.000Z"),
      new Member("user_3", "viewer", "2025-01-07T14:00:00.000Z"),
    ],
  },

  {
    tenant_id: "tenant_collective_1",
    handle: "paris-collective",
    name: "Paris Collective",
    description: "Independent collective for music & visual storytelling",
    avatar: "https://i.pravatar.cc/150?img=18",

    created_at: "2025-02-10T09:30:00.000Z",
    created_by: "user_1",

    members: [
      new Member("user_1", "admin", "2025-02-10T09:30:00.000Z"),
      new Member("user_3", "editor", "2025-02-11T11:00:00.000Z"),
    ],
  },

  {
    // Smaller team / edge case
    tenant_id: "tenant_solo_1",
    handle: "solo-projects",
    name: "Solo Projects",
    description: "Personal experiments & drafts",
    created_at: "2025-03-01T08:00:00.000Z",
    created_by: "user_1",

    members: [
      new Member("user_1", "admin"),
    ],
  },
];
