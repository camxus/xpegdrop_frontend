"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi, Note } from "@/lib/api/notesApi";
import { useToast } from "../use-toast";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage";

export const LOCAL_NOTES_STORAGE_KEY = "local_notes";

export function useNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [projectNotes, setProjectNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  const saveLocalNotes = (projectId: string, imageName: string, notes: Note[]) => {
    const localData = getLocalStorage(LOCAL_NOTES_STORAGE_KEY) || {};
    localData[projectId][imageName] = notes;
    setLocalStorage(LOCAL_NOTES_STORAGE_KEY, localData);
  };

  // All notes from current user
  const userNotes: Note[] = user?.user_id
    ? notes.filter(n => n.user_id === user?.user_id)
    : [];

  // All notes from other users
  const foreignNotes: Note[] = user?.user_id
    ? notes.filter(n => n.user_id !== user?.user_id)
    : [];

  // Mutation: Get notes
  const getProjectNotes = useMutation({
    mutationFn: async (projectId: string) => {
      if (!projectId) return [];
      const res = await notesApi.getProjectNotes(projectId);
      return res;
    },
    onSuccess: (data, projectId) => {
      if (!data || !projectId) return;

      const notesArray: Note[] = Array.isArray(data) ? data : data.notes;

      setProjectNotes(notesArray)
    }
  });

  // Mutation: Get notes
  const getImageNotes = useMutation({
    mutationFn: async ({ projectId, imageName }: { projectId: string, imageName: string }) => {
      if (!projectId) return [];
      const res = await notesApi.getImageNotes(projectId, imageName);
      return res;
    },
    onSuccess: (data, { projectId, imageName }) => {
      if (!data || !projectId) return;

      const localData = getLocalStorage(LOCAL_NOTES_STORAGE_KEY) || {};

      const notesArray: Note[] = Array.isArray(data) ? data : data.notes;

      setNotes([
        ...notesArray,
        ...(localData[projectId][imageName || ""] || [])
      ].filter((note, index, self) =>
        index === self.findIndex((n) => n.note_id === note.note_id)
      ));
    },
  });

  // Mutation: Create note
  const createNote = useMutation({
    mutationFn: (note: { project_id: string, image_name: string; content: string }) =>
      notesApi.createNote(note),
    onSuccess: (data) => {
      if (!data) return;

      const projectId = data.project_id;
      const updated = [...notes, data];
      setNotes(updated);

      if (!user?.user_id && projectId) saveLocalNotes(projectId, data.image_name, updated);

      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      toast({
        title: "Note created",
        description: "Your note was saved successfully.",
      });
    },
    onError: (err: any) => {
      console.error("Create note error:", err);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Update note
  const updateNote = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) => {
      setNotes(prev =>
        prev.map(n => (n.note_id === noteId ? { ...n, content } : n))
      );
      return notesApi.updateNote(noteId, content);
    },
    onSuccess: (data, variables) => {
      const { noteId } = variables;
      const updated = notes.map(n => (n.note_id === noteId ? { ...n, content: variables.content } : n));
      setNotes(updated);

      if (!user?.user_id && updated[0]?.project_id) saveLocalNotes(updated[0].project_id, updated[0].image_name, updated);

      queryClient.invalidateQueries({ queryKey: ["notes", updated[0]?.project_id] });
      toast({
        title: "Note updated",
        description: "Your note was updated successfully.",
      });
    },
    onError: (err: any, variables) => {
      const { noteId } = variables;
      const prevContent = notes.find(n => n.note_id === noteId)?.content || "";

      setNotes(prev =>
        prev.map(n => (n.note_id === noteId ? { ...n, content: prevContent } : n))
      );

      console.error("Update note error:", err);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete note
  const deleteNote = useMutation({
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (err: any) => {
      console.error("Delete note error:", err);
    },
  });

  return {
    notes,
    projectNotes,
    userNotes,
    foreignNotes,
    getProjectNotes,
    getImageNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
