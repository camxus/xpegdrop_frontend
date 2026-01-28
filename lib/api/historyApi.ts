import { api } from "./client";

export enum HistoryType {
  PROJECT_CREATED = "project_created",
  PROJECT_UPDATED = "project_updated",
  PROJECT_DELETED = "project_deleted",
  FILE_ADDED = "file_added",
  FILE_REMOVED = "file_removed",
  NOTE = "note",
  RATING = "rating",
}

export class History {
  project_history_id?: string = undefined;
  project_id: string = "";
  actor_id: string = "";   // who performed the action
  type: HistoryType = HistoryType.PROJECT_CREATED;
  title: string = "";
  description?: string = "";
  created_at?: string;
  updated_at?: string;
}

export const historyApi = {
  // Create a new history record
  createHistory: async (history: {
    project_id: string;
    user_id: string;
    actor_id: string;
    type: string;
    title: string;
    description?: string;
  }) => {
    return await api.post<{ message: string; record: History }>(
      "/history",
      history
    );
  },

  // Get all history for a project
  getHistory: async (projectId: string) => {
    return await api.get<History[]>(
      `/history/${projectId}`
    );
  },

  // Update a specific history record
  updateHistory: async (
    projectId: string,
    historyId: string,
    updates: {
      title?: string;
      description?: string;
      type?: string;
    }
  ) => {
    return await api.patch(
      `/history/${projectId}/${historyId}`,
      updates
    );
  },

  // Delete a specific history record
  deleteHistory: async (projectId: string, historyId: string) => {
    return await api.delete(
      `/history/${projectId}/${historyId}`
    );
  },
};
