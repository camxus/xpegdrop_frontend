export interface Project {
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  share_url: string;
  dropbox_folder_path?: string;
  dropbox_shared_link?: string;
  created_at: string;
  is_public: boolean;
  approved_emails: string[];
  updated_at?: string;
}
