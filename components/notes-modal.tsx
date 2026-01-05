"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/hooks/api/useNotes";
import { Note } from "@/lib/api/notesApi";
import { useAuth } from "@/hooks/api/useAuth";
import { useUser, useUsers } from "@/hooks/api/useUser";
import { Button } from "./ui/button";
import { MoreHorizontal, X } from "lucide-react";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useDialog } from "@/hooks/use-dialog";
import UnauthorizedNoteDialog, { UnauthorizedNoteDialogActions } from "./unauthorized-note-dialog";
import { Separator } from "./ui/seperator";

interface NotesViewProps {
  projectId: string;
  imageName: string;
}

export function NotesModal({ projectId, imageName }: NotesViewProps) {
  const { show, hide } = useDialog()
  const { user } = useAuth();
  const { localUser, setLocalUser } = useUser()
  const {
    notes,
    setNotes,
    getImageNotes: { mutateAsync: getImageNotes },
    createNote: { mutateAsync: createNote },
    updateNote: { mutateAsync: updateNote },
    deleteNote: { mutateAsync: deleteNote },
  } = useNotes();

  const userQueries = useUsers(notes.map((note) => note.user_id));

  const uniqueUsers = Array.from(
    new Map(userQueries.map((u) => [u.data?.user_id, u.data])).values()
  );

  const [noteContent, setNoteContent] = useState(""); // used for bottom textarea
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    getImageNotes({ projectId, imageName });
  }, [imageName]);

  const handleCreateOrUpdate = async (author?: { firstName: string, lastName: string }) => {
    if (!noteContent.trim()) return;

    const firstName = user?.first_name ?? localUser?.first_name ?? author?.firstName;
    const lastName = user?.last_name ?? localUser?.last_name ?? author?.lastName;

    if (!firstName || !lastName) {
      show({
        title: "You're currently not signed in",
        description: "Leave a note with your name so the owner knows who accessed this folder.",
        content: UnauthorizedNoteDialog,
        actions: UnauthorizedNoteDialogActions,
        contentProps: {
          onSubmit: (firstName: string, lastName: string) => {
            if (!firstName || !lastName) return

            setLocalUser({ first_name: firstName, last_name: lastName })
            handleCreateOrUpdate({ firstName, lastName })
            hide()
            return
          }
        }
      })

      return
    }

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
        author: { first_name: firstName, last_name: lastName }
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

  // Helper: round date down to nearest 10 minutes
  const roundTo10Minutes = (date: Date) => {
    const minutes = Math.floor(date.getMinutes() / 10) * 10;
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      minutes
    );
  };

  // Group notes by 10-minute window
  const groupedNotes: Record<string, Note[]> = {};
  notes.forEach((note) => {
    const rounded = roundTo10Minutes(new Date(note.created_at!));
    const key = rounded.toISOString();
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(note);
  });

  const sortedKeys = Object.keys(groupedNotes).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
        {sortedKeys.map((timeKey) => {
          const time = new Date(timeKey);
          const notesInGroup = groupedNotes[timeKey].sort(
            (a, b) =>
              new Date(a.created_at!).getTime() -
              new Date(b.created_at!).getTime()
          );;

          const getAuthorKey = (note: Note) =>
            note.user_id.includes("anonymous")
              ? `anonymous:${note.author?.first_name}-${note.author?.last_name}`
              : note.user_id;

          const groupByConsecutiveAuthor = (notes: Note[]) => {
            const groups: Note[][] = [];

            notes.forEach((note) => {
              const lastGroup = groups[groups.length - 1];

              if (
                lastGroup &&
                getAuthorKey(lastGroup[0]) === getAuthorKey(note)
              ) {
                lastGroup.push(note);
              } else {
                groups.push([note]);
              }
            });

            return groups;
          };

          const authorGroups = groupByConsecutiveAuthor(notesInGroup);

          return (
            <div key={timeKey} className="flex flex-col gap-2">
              {/* Time Header */}
              <p className="text-xs text-muted-foreground font-semibold text-center w-full">
                {formatDistanceToNow(time, { addSuffix: true })}
              </p>

              {authorGroups.map((group, groupIndex) => {
                const firstNote = group[0];

                const isMe = firstNote.user_id === user?.user_id;
                const isAnonymous = firstNote.user_id.includes("anonymous");

                const firstName = isAnonymous
                  ? firstNote.author?.first_name
                  : getNoteUser(firstNote)?.first_name;

                const lastName = isAnonymous
                  ? firstNote.author?.last_name
                  : getNoteUser(firstNote)?.last_name;

                return (
                  <div
                    key={`${firstNote.note_id}-${groupIndex}`}
                    className="flex flex-col gap-2 bg-background rounded-sm p-2 shadow-xl border-foreground/60"
                  >
                    {/* Author header */}
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 text-xs">
                        <AvatarImage
                          src={(getNoteUser(firstNote)?.avatar as string) || ""}
                        />
                        <AvatarFallback>
                          {getInitials(firstName || "", lastName || "")}
                        </AvatarFallback>
                      </Avatar>

                      <p className="text-sm font-medium">
                        {isMe ? "You" : `${firstName ?? ""} ${lastName ?? ""}`}
                      </p>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-0 py-2 pl-8">
                      {group.map((note, index) => (
                        <div key={note.note_id} className="relative">
                          <p className="whitespace-pre-wrap text-sm">
                            {note.content}
                          </p>


                          {index < group.length - 1 && (
                            <Separator className="my-3" />
                          )}

                          {isMe && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 -top-2"
                                >
                                  <MoreHorizontal size={10} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent sideOffset={4}>
                                <DropdownMenuItem onSelect={() => handleEdit(note)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleDelete(note.note_id!)}
                                  className="text-destructive-foreground"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateOrUpdate();
          }}
          className="flex gap-2 items-center"
        >
          <Textarea
            resizable={false}
            className="flex-1"
            placeholder="Add a new note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            maxLength={500}
            onKeyDown={(e) => {
              // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleCreateOrUpdate();
              }
              // Enter (without Shift) submits
              else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateOrUpdate();
              }
            }}
          />

          <Button type="submit">{editingNoteId ? "Update" : "Add"}</Button>
        </form>
      </div>
    </div>
  );
}
