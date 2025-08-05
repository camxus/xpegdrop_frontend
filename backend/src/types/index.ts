export interface SignUpInput {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  dropbox_access_token?: string;
}

export interface SignInInput {
  username: string;
  password: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  dropbox_access_token?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  share_url: string;
  dropbox_folder_path?: string;
  dropbox_shared_link?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  files: File[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}