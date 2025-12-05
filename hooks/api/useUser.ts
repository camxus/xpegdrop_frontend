"use client";

import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { userApi } from "@/lib/api/usersApi";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage";
import { AUTH_USER_KEY, useAuth } from "./useAuth";

export const LOCAL_USER_STORAGE_KEY = "local_user";

export function useUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const localUser: Partial<User> = getLocalStorage(LOCAL_USER_STORAGE_KEY)
  const setLocalUser = (user: Partial<User>) => setLocalStorage(LOCAL_USER_STORAGE_KEY, user || { ...localUser, user })

  // Get current authenticated user
  const currentUser = useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const user = await userApi.getCurrentUser()

      setLocalStorage(AUTH_USER_KEY, user);

      return user
    },
    enabled: !!user
  });

  // Get user by ID (fallback to current user if not passed)
  const getUserById = (userId?: string) =>
    useQuery<User, Error>({
      queryKey: ["user", userId],
      queryFn: () =>
        userId && userId.includes("anonymous")
          ? Promise.resolve(new AnonymousUser(userId))
          : userApi.getUserById(userId!),
      enabled: !!userId,
    });

  // Get user by public username
  const getUserByUsername = useMutation<User, Error, string>({
    mutationFn: (username: string) => userApi.getUserByUsername(username),
  });

  // Get user by public username
  const searchByUsername = useMutation<User[], Error, string>({
    mutationFn: (username: string) => userApi.searchByUsername(username),
  });

  // ✅ Update user info + avatar with toast
  const updateUser = useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: (data) => {
      setLocalStorage(AUTH_USER_KEY, data.user);
      toast({
        title: "Profile updated",
        description: "Your profile was successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // ✅ Update Dropbox token with toast
  const updateDropboxToken = useMutation({
    mutationFn: userApi.updateDropboxToken,
    onSuccess: () => {
      toast({
        title: "Dropbox connected",
        description: "Your Dropbox token was saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Dropbox update failed",
        description: error?.message || "Unable to update Dropbox token.",
        variant: "destructive",
      });
    },
  });

  // ✅ Delete user with toast
  const deleteUser = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been removed.",
      });
      queryClient.removeQueries({ queryKey: ["user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Account deletion failed",
        description: error?.message || "Failed to delete account.",
        variant: "destructive",
      });
    },
  });

  return {
    localUser,
    setLocalUser,
    currentUser,
    getUserById,
    searchByUsername,
    getUserByUsername,
    updateUser,
    updateDropboxToken,
    deleteUser,
  };
}

export class AnonymousUser implements User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string | undefined;
  avatar?: string | undefined;
  dropbox?: { access_token?: string; refresh_token?: string } | undefined;
  created_at: string;
  updated_at?: string | undefined;

  constructor(userId: string) {
    this.user_id = userId;
    this.username = "Anonymous";
    this.email = "";
    this.first_name = "Anonymous";
    this.last_name = "User";
    this.bio = "";
    this.avatar = "";
    this.created_at = new Date().toISOString();
  }
}

export function useUsers(userIds: string[]) {
  const queries = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: ["profile", userId],
      queryFn: () =>
        userId.includes("anonymous")
          ? Promise.resolve(new AnonymousUser(userId))
          : userApi.getUserById(userId),
    })),
  });

  return queries;
}
