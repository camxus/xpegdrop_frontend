import { S3Location } from "@/types/user";
import { api } from "./client";

export interface TeamMember {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  invited_by?: string;
}

export interface Team {
  team_id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  avatar?: S3Location | string;
  created_at: string;
  updated_at?: string;
}

export const teamsApi = {
  /**
   * Create a new team
   */
  createTeam: async (data: { name: string; description?: string }) => {
    return await api.post<Team>("/teams", data);
  },

  /**
   * Get all teams for the current user
   */
  getTeams: async () => {
    return await api.get<Team[]>("/teams");
  },

  /**
   * Get a single team by ID
   */
  getTeam: async (teamId: string) => {
    return await api.get<Team>(`/teams/${teamId}`);
  },

  /**
   * Update a team's info
   */
  updateTeam: async (
    teamId: string,
    data: Partial<Pick<Team, "name" | "description" | "avatar">>
  ) => {
    return await api.put(`/teams/${teamId}`, data);
  },

  /**
   * Delete a team (admin only)
   */
  deleteTeam: async (teamId: string) => {
    return await api.delete(`/teams/${teamId}`);
  },

  /**
   * Invite a new member to the team (admin only)
   */
  inviteMember: async (teamId: string, user_id: string, role: "admin" | "member" = "member") => {
    return await api.post(`/teams/${teamId}/invite`, { user_id, role });
  },

  /**
   * Remove a member from the team (admin only)
   */
  removeMember: async (teamId: string, userId: string) => {
    return await api.delete(`/teams/${teamId}/members/${userId}`);
  },
};
