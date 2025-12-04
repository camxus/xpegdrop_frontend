export interface S3Location {
  bucket: string
  key: string
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar?: S3Location | string;
  dropbox?: {
    access_token?: string;
    refresh_token?: string;
  };
  created_at: string;
  updated_at?: string;

  stripe?: {
    customer_id?: string;
  };

  membership?: {
    membership_id?: string;
    status?: "active" | "past_due" | "canceled" | "incomplete" | "trialing" | string;
  };
}
