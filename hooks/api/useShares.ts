"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { sharesApi } from "@/lib/api/sharesApi";
import type { CreateShareDto, Share, ShareMode, ShareModeShort } from "@/types/share";

export function useShares() {
  const queryClient = useQueryClient();

  // List all shares for a project (manual fetch via mutation)
  const getShares = useMutation({
    mutationFn: ({ projectId }: { projectId: string }) => {
      return sharesApi.listSharesByProject(projectId);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to fetch shares",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
    onSuccess: (shares: Share[]) => {
      queryClient.setQueryData(["shares"], shares);
    },
  });

  // Get a single share by ID and mode ('c' | 'p')
  const getShareById = useMutation({
    mutationFn: ({ shareId, mode }: { shareId: string; mode: ShareModeShort }) =>
      sharesApi.getShareById(shareId, mode),
    onError: (err: any) => {
      toast({
        title: "Failed to fetch share",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Create a new share
  const createShare = useMutation({
    mutationFn: (data: CreateShareDto) => sharesApi.createShare(data),
    onSuccess: (share: Share) => {
      queryClient.invalidateQueries({ queryKey: ["shares"] });
      toast({
        title: "Share created",
        description: "The project has been shared successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create share",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Update a share
  const updateShare = useMutation({
    mutationFn: ({ shareId, data }: { shareId: string; data: Partial<Share> }) =>
      sharesApi.updateShare(shareId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares"] });
      toast({
        title: "Share updated",
        description: "The share settings have been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update share",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Delete a share
  const deleteShare = useMutation({
    mutationFn: (shareId: string) => sharesApi.deleteShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares"] });
      toast({
        title: "Share deleted",
        description: "The share has been removed successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to delete share",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  return {
    getShares,
    getShareById,
    createShare,
    updateShare,
    deleteShare,
  };
}