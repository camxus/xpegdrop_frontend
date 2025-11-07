"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi, Team } from "@/lib/api/teamsApi";
import { useToast } from "../use-toast";
import { useAuth } from "./useAuth";

export function useTeams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);

  /**
   * Fetch teams for the current user
   */
  useQuery({
    queryKey: ["teams", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      const data = await teamsApi.getTeams();
      setTeams(data);
      return data;
    },
    enabled: !!user?.user_id,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  /**
   * Create a new team
   */
  const createTeam = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      if (!user?.user_id) throw new Error("User not logged in");
      return await teamsApi.createTeam(payload);
    },
    onSuccess: (data) => {
      setTeams((prev) => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ["teams", user?.user_id] });
      toast({
        title: "Team created",
        description: `Team "${data.name}" was created successfully.`,
      });
    },
    onError: (err: any) => {
      console.error("Create team error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  /**
   * Update team details (admin only)
   */
  const updateTeam = useMutation({
    mutationFn: async ({
      teamId,
      updates,
    }: {
      teamId: string;
      updates: Partial<Pick<Team, "name" | "description" | "avatar">>;
    }) => await teamsApi.updateTeam(teamId, updates),
    onSuccess: (data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.user_id] });
      toast({
        title: "Team updated",
        description: `Your team was updated successfully.`,
      });
    },
    onError: (err: any) => {
      console.error("Update team error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to update team.",
        variant: "destructive",
      });
    },
  });

  /**
   * Delete team
   */
  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => await teamsApi.deleteTeam(teamId),
    onSuccess: (_, teamId) => {
      setTeams((prev) => prev.filter((t) => t.team_id !== teamId));
      queryClient.invalidateQueries({ queryKey: ["teams", user?.user_id] });
      toast({
        title: "Team deleted",
        description: `Team was deleted successfully.`,
      });
    },
    onError: (err: any) => {
      console.error("Delete team error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to delete team.",
        variant: "destructive",
      });
    },
  });

  /**
   * Invite a team member
   */
  const inviteMember = useMutation({
    mutationFn: async ({
      teamId,
      userId,
      role = "member",
    }: {
      teamId: string;
      userId: string;
      role?: "admin" | "member";
    }) => await teamsApi.inviteMember(teamId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.user_id] });
      toast({
        title: "Member invited",
        description: "The user has been invited to your team.",
      });
    },
    onError: (err: any) => {
      console.error("Invite member error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to invite member.",
        variant: "destructive",
      });
    },
  });

  /**
   * Remove a team member
   */
  const removeMember = useMutation({
    mutationFn: async ({
      teamId,
      userId,
    }: {
      teamId: string;
      userId: string;
    }) => await teamsApi.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", user?.user_id] });
      toast({
        title: "Member removed",
        description: "The member was removed from the team.",
      });
    },
    onError: (err: any) => {
      console.error("Remove member error:", err);
      toast({
        title: "Error",
        description: err?.response?.data?.error || "Failed to remove member.",
        variant: "destructive",
      });
    },
  });

  return {
    teams,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    removeMember,
  };
}
