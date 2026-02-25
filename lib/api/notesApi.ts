import { api } from "./client";

export class Note {
  note_id?: string = undefined;
  project_id: string = "";
  share_id: string = "";
  media_name: string = "";
  user_id: string = "";
  content: string = "";
  timestamp: number | null = null;
  created_at?: string = undefined;
  updated_at?: string = undefined;
  author: { first_name: string; last_name: string } = { first_name: "", last_name: "" };
}

export const notesApi = {
  // Create new note (authenticated)
  createNote: async (note: Partial<Note>) => {
    return await api.post<Note>("/notes", note);
  },

  // Get all notes for a project (optional share_id)
  getProjectNotes: async (projectId: string, share_id?: string) => {
    const query = share_id ? `?share_id=${share_id}` : "";
    return await api.get<{ notes: Note[]; total: number }>(`/notes/${projectId}${query}`);
  },

  // Get all notes for a project and media (optional share_id)
  getImageNotes: async (projectId: string, mediaName: string, share_id?: string) => {
    const query = share_id ? `?share_id=${share_id}` : "";
    return await api.get<{ notes: Note[]; total: number }>(`/notes/${projectId}/${mediaName}${query}`);
  },

  // Update a note by ID
  updateNote: async (noteId: string, content: string, timestamp: number | null) => {
    return await api.put(`/notes/${noteId}`, { content, timestamp });
  },

  // Delete a note by ID
  deleteNote: async (noteId: string) => {
    return await api.delete(`/notes/${noteId}`);
  },
};