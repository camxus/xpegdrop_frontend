import { Project } from "@/types/project";

export const mockTenantProjects: Project[] = [
  {
    project_id: "proj_001",
    tenant_id: "tenant_agency_1",
    user_id: "user_001",
    name: "FEVER – Visual Rollout",
    description: "Assets and timelines for the FEVER single release.",
    share_url: "https://app.example.com/share/proj_001",
    dropbox_folder_path: "/FEVER/visuals",
    dropbox_shared_link: "https://dropbox.com/s/fever-visuals",
    b2_folder_path: "projects/fever",
    b2_shared_link: "https://f001.backblazeb2.com/file/fever",
    created_at: "2025-02-01T10:15:00Z",
    updated_at: "2025-02-10T14:30:00Z",
    is_public: false,
    can_download: true,
    approved_emails: ["editor@label.com"],
    approved_users: [{ user_id: "user_002" }],
    approved_tenant_users: [
      { user_id: "user_001", role: "admin" },
      { user_id: "user_002", role: "editor" }
    ],
    status: "initiated",
  },
  {
    project_id: "proj_002",
    tenant_id: "tenant_agency_1",
    user_id: "user_003",
    name: "Paris Studio Session",
    description: "Raw takes and session notes from Paris recordings.",
    share_url: "https://app.example.com/share/proj_002",
    created_at: "2025-02-12T08:00:00Z",
    is_public: true,
    can_download: false,
    approved_emails: [],
    approved_users: [
      { user_id: "user_001" },
      { user_id: "user_004" }
    ],
    approved_tenant_users: [
      { user_id: "user_001", role: "admin" },
      { user_id: "user_004", role: "viewer" }
    ],
    status: "created",
  },
  {
    project_id: "proj_003",
    tenant_id: "tenant_agency_1",
    user_id: "user_005",
    name: "Website Redesign Assets",
    description: "Design exports and handoff files.",
    share_url: "https://app.example.com/share/proj_003",
    dropbox_folder_path: "/Web/Redesign",
    created_at: "2025-01-20T16:45:00Z",
    updated_at: "2025-01-28T09:10:00Z",
    is_public: false,
    can_download: true,
    approved_emails: ["client@company.com"],
    approved_users: [{ user_id: "user_006" }],
    approved_tenant_users: [
      { user_id: "user_005", role: "admin" },
      { user_id: "user_006", role: "editor" }
    ],
    status: "initiated",
  },
];
