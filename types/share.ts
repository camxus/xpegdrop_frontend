export type ShareModeShort = "s" | "p";

export type ShareMode = "collaborative" | "presentation";

export interface Share {
  share_id: string;
  project_id: string;
  created_by: string;

  name: string;

  mode: ShareMode; // "collaborative" | "presentation"

  // Access control
  is_public: boolean;
  approved_emails: { value: string; role: "editor" | "viewer" }[];
  approved_users: { user_id: string; role: "editor" | "viewer" }[];

  // Link
  expires_at?: string;

  // Permissions
  can_rate?: boolean;
  can_download?: boolean;
  can_note?: boolean;
  can_upload?: boolean;

  created_at: string;
  updated_at?: string;
}

export interface CreateShareDto {
  project_id: string; // ID of the project to share
  name: string;       // Name of the share
  mode: ShareMode;    // "collaborative" | "presentation"

  // Access control
  is_public?: boolean; // default false
  approved_emails?: { value: string; role: "editor" | "viewer" }[];
  approved_users?: { user_id: string; role: "editor" | "viewer" }[];

  // Permissions
  can_download?: boolean;
  can_rate?: boolean;
  can_note?: boolean;
  can_upload?: boolean;

  // Optional expiration
  expires_at?: string; // ISO date string
}