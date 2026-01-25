export interface Project {
  project_id: string;
  tenant_id?: string;
  user_id: string;
  name: string;
  description?: string;
  share_url: string;
  dropbox_folder_path?: string;
  dropbox_shared_link?: string;
  b2_folder_path?: string;
  b2_shared_link?: string;
  created_at: string;
  is_public: boolean;
  approved_emails: string[];
  can_download: boolean;
  updated_at?: string;
  approved_users: { user_id: string, role: string }[]
  approved_tenant_users: { user_id: string, role: string }[]
  status: "created" | "initiated"
}
