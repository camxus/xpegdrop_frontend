"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/hooks/api/useNotes";
import { Note } from "@/lib/api/notesApi";
import { useAuth } from "@/hooks/api/useAuth";
import { useUsers } from "@/hooks/api/useUser";
import { Button } from "./ui/button";
import { Edit2, MoreHorizontal, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/lib/utils";

interface NotesViewProps {
  projectId: string;
  imageName: string;
}

export function NotesModal({ projectId, imageName }: NotesViewProps) {
  const { user } = useAuth();
  const {
    notes,
    setNotes,
    getNotes: { mutateAsync: getNotes },
    createNote: { mutateAsync: createNote },
    updateNote: { mutateAsync: updateNote },
    deleteNote: { mutateAsync: deleteNote },
  } = useNotes();

  const usersQueries = useUsers(notes.map((note) => note.user_id));

  const uniqueUsers = Array.from(
    new Map(usersQueries.map((u) => [u.data?.user_id, u.data])).values()
  );

  const [noteContent, setNoteContent] = useState(""); // used for bottom textarea
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    getNotes({ projectId, imageName });
  }, [imageName]);

  const handleCreateOrUpdate = async () => {
    if (!noteContent.trim()) return;

    if (editingNoteId) {
      await updateNote({
        noteId: editingNoteId,
        content: noteContent,
      });
      setEditingNoteId(null);
    } else {
      await createNote({
        project_id: projectId,
        image_name: imageName,
        content: noteContent,
      });
    }

    setNoteContent("");
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    // Remove note from local state
    setNotes((prev) => prev.filter((note) => note.note_id !== noteId));

    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setNoteContent("");
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNoteId(note.note_id!);
    setNoteContent(note.content);
  };

  const getNoteUser = (note: Note) => {
    return uniqueUsers.find((user) => user?.user_id === note.user_id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
        {notes.map((note: Note) => (
          <div key={note.note_id} className="relative p-2 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={(getNoteUser(note)?.avatar as string) || ""}
                  alt={getNoteUser(note)?.username}
                />
                <AvatarFallback>
                  {getInitials(
                    getNoteUser(note)?.first_name || "",
                    getNoteUser(note)?.last_name || ""
                  )}
                </AvatarFallback>
              </Avatar>{" "}
              {/* Note Content */}
              <p className="flex-1 p-1 whitespace-pre-wrap">{note.content}</p>
              {/* Three-dot Dropdown Menu for Edit/Delete */}
              {user?.user_id === note.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="ml-auto mr-2">
                      <MoreHorizontal size={10} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={4}>
                    <DropdownMenuItem onSelect={() => handleEdit(note)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleDelete(note.note_id!)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Bottom textarea for add/edit */}
      <div className="flex flex-col gap-1 p-2 border-t">
        {editingNoteId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Editing note</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingNoteId(null);
                setNoteContent("");
              }}
              className="p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            resizable={false}
            className="flex-1"
            placeholder="Add a new note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateOrUpdate();
              }
            }}
          />
          <Button onClick={handleCreateOrUpdate}>
            {editingNoteId ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
