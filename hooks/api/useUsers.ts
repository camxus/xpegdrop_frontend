"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/usersApi";
import type { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

export function useUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current authenticated user
  const currentUser = useQuery<User, Error>({
    queryKey: ["user"],
    queryFn: userApi.getCurrentUser,
  });

  // Get user by ID (fallback to current user if not passed)
  const getUserById = (userId?: string) =>
    useQuery<User, Error>({
      queryKey: ["user", userId],
      queryFn: () => userApi.getUserById(userId),
      enabled: !!userId,
    });

  // Get user by public username
  const getUserByUsername = useMutation<User, Error, string>({
    mutationFn: (username: string) => userApi.getUserByUsername(username),
  });

  // ✅ Update user info + avatar with toast
  const updateUser = useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: () => {
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
    currentUser,
    getUserById,
    getUserByUsername,
    updateUser,
    updateDropboxToken,
    deleteUser,
  };
}
