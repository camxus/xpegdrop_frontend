import { User } from "@/types/user";
import { api } from "./client";

// Types
export interface SignupRequest extends Partial<User> {
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  avatar_file?: File;
}

export interface SignupResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  token: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  };
  user: User;
}

export type RefreshTokenResponse = LoginResponse;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface SetNewPasswordRequest {
  email: string;
  newPassword: string;
}

// Auth API functions
export const authApi = {
  /**
   * Register a new user
   */
  signup: (data: SignupRequest): Promise<SignupResponse> => {
    const formData = new FormData();

    // Append fields
    formData.append("username", data.username || "");
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("first_name", data.first_name);
    formData.append("last_name", data.last_name);

    if (data.bio) formData.append("bio", data.bio);
    if (data.dropbox?.access_token && data.dropbox.refresh_token) formData.append("dropbox", JSON.stringify(data.dropbox));
    if (data.avatar_file) formData.append("avatar", data.avatar_file); // File

    return api.post("/auth/signup", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Login a user
   */
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return api.post("/auth/login", data);
  },

  /**
   * Logout the current user
   */
  logout: (): Promise<void> => {
    return api.post("/auth/logout");
  },
  /**
   * Refresh access token using refresh token (usually via HttpOnly cookie)
   */
  refreshToken: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return api.post("/auth/refresh-token", data);
  },

  /**
   * Initiate forgot password flow - sends reset code/email
   */
  forgotPassword: (data: ForgotPasswordRequest): Promise<void> => {
    return api.post("/auth/forgot-password", data);
  },

  /**
   * Confirm password reset with code
   */
  confirmPassword: (data: ConfirmPasswordRequest): Promise<void> => {
    return api.post("/auth/confirm-password", data);
  },

  /**
   * Set new password after confirmation
   */
  setNewPassword: (data: SetNewPasswordRequest): Promise<void> => {
    return api.post("/auth/set-new-password", data);
  },
};
