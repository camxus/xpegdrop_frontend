
export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  dropbox?: {
    access_token?: string;
    refresh_token?: string;
  };
  created_at: string;
  updated_at?: string;
}
