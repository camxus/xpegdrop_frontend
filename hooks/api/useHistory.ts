"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { historyApi, History, HistoryType } from "@/lib/api/historyApi";
import { useToast } from "@/hooks/use-toast";

export function useHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Get all history for a project
   */
  const getProjectHistory = (projectId: string) =>
    useQuery({
      queryKey: ["history", projectId],
      queryFn: () => historyApi.getHistory(projectId),
      enabled: !!projectId,
    });

  /**
   * Create a history entry
   */
  const createHistory = useMutation({
    mutationFn: (data: {
      project_id: string;
      user_id: string;
      actor_id: string;
      type: HistoryType;
      title: string;
      description?: string;
    }) => historyApi.createHistory(data),
    onSuccess: (_, variables) => {
      toast({
        title: "Activity recorded",
        description: variables.title,
      });

      queryClient.invalidateQueries({
        queryKey: ["history", variables.project_id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record activity",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  /**
   * Update a history entry
   */
  const updateHistory = useMutation({
    mutationFn: (params: {
      project_id: string;
      history_id: string;
      updates: {
        title?: string;
        description?: string;
        type?: HistoryType;
      };
    }) =>
      historyApi.updateHistory(
        params.project_id,
        params.history_id,
        params.updates
      ),
    onSuccess: (_, variables) => {
      toast({
        title: "Activity updated",
        description: "History entry was successfully updated.",
      });

      queryClient.invalidateQueries({
        queryKey: ["history", variables.project_id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Failed to update history.",
        variant: "destructive",
      });
    },
  });

  /**
   * Delete a history entry
   */
  const deleteHistory = useMutation({
    mutationFn: (params: { project_id: string; history_id: string }) =>
      historyApi.deleteHistory(params.project_id, params.history_id),
    onSuccess: (_, variables) => {
      toast({
        title: "Activity removed",
        description: "History entry was deleted.",
      });

      queryClient.invalidateQueries({
        queryKey: ["history", variables.project_id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error?.message || "Failed to delete history.",
        variant: "destructive",
      });
    },
  });

  return {
    getProjectHistory,
    createHistory,
    updateHistory,
    deleteHistory,
  };
}
