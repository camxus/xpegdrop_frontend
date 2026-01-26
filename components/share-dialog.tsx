"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Share2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, getInitials, isSameSet } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/hooks/api/useProjects";
import { Project } from "@/types/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useUsers } from "@/hooks/api/useUser";
import { User } from "@/types/user";
import { useDialog } from "@/hooks/use-dialog";
import { useAuth } from "@/hooks/api/useAuth";
import { useTenants } from "./tenants-provider";

interface ShareDialogProps {
  project: Project;
  onClose: () => void;
}

export function ShareDialog({ project, onClose }: ShareDialogProps) {
  const { user } = useAuth()
  const {
    updateProject: { mutateAsync: updateProject },
  } = useProjects();
  const { show, updateProps } = useDialog()
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState<string[]>(project.approved_emails || []);
  const [newEmail, setNewEmail] = useState("");
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [canDownload, setCanDownload] = useState(project.can_download);
  const [approvedUsers, setApprovedUsers] = useState(project.approved_users || []);
  const [tenantUsers, setTenantUsers] = useState(project.approved_tenant_users || []);

  const userQueries = useUsers([...approvedUsers.map(u => u.user_id), ...tenantUsers.map(u => u.user_id)]);
  const projectUsers = userQueries.map(u => u.data).filter(Boolean) as User[];

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(project.share_url);
      setCopied(true);
      toast({ title: "Success", description: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email",
        variant: "destructive",
      });
      return;
    }
    if (emails.includes(newEmail)) {
      toast({
        title: "Already added",
        description: "This email is already approved",
      });
      return;
    }
    setEmails([...emails, newEmail]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleAddApprovedUser = (userId: string, role: string) => {
    if (!approvedUsers.map(u => u.user_id).includes(userId)) setApprovedUsers([...approvedUsers, { user_id: userId, role }]);
  };

  const handleRemoveApprovedUser = (userId: string) => {
    setApprovedUsers(approvedUsers.filter((u) => u.user_id !== userId));
  };

  const handleAddTenantUser = (userId: string, role: Project["approved_tenant_users"][number]["role"]) => {
    if (!tenantUsers.map(u => u.user_id).includes(userId)) setTenantUsers([...tenantUsers, { user_id: userId, role: role }]);
  };

  const handleRemoveTenantUser = (userId: string) => {
    setTenantUsers(tenantUsers.filter((u) => u.user_id !== userId));
  };

  // Auto-update project
  useEffect(() => {
    const update = async () => {
      try {
        await updateProject({
          projectId: project.project_id,
          data: {
            is_public: isPublic,
            approved_emails: emails,
            can_download: canDownload,
            approved_users: approvedUsers,
            approved_tenant_users: tenantUsers,
          },
        });
        toast({ title: "Project updated", description: "Settings saved" });
      } catch {
        toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
      }
    };

    const hasChanged =
      project.is_public !== isPublic ||
      project.can_download !== canDownload ||
      !isSameSet(project.approved_emails, emails, e => e) ||
      !isSameSet(project.approved_users, approvedUsers, u => u.user_id) ||
      !isSameSet(project.approved_tenant_users, tenantUsers, u => u.user_id);


    if (hasChanged) {
      update();
    }
  }, [isPublic, emails, canDownload, approvedUsers, tenantUsers]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Share Folder</h3>
          <p className="text-xs text-muted-foreground">
            Share "{project.name}" with others
          </p>
        </div>
      </div>

      {/* Share link */}
      <div className="space-y-2">
        <Label htmlFor="share-url">Share Link</Label>
        <div className="flex gap-2">
          <Input
            id="share-url"
            value={project.share_url}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopyToClipboard}
            className={cn(
              "shrink-0 transition-colors",
              copied && "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>


      {/* Approved emails */}
      <AnimatePresence initial={false}>
        {!isPublic && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              height: { duration: 0.3 },
            }}
          >
            <div
              className="space-y-2 overflow-hidden"
            >
              <Label>Approved Emails</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                />
                <Button type="button" size="icon" onClick={handleAddEmail}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {emails.length > 0 && (
                <ul className="space-y-1">
                  {emails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      {email}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveEmail(email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Approved users */}
            <div className="flex flex-col gap-2">
              <Label>Project Users</Label>
              <div className="space-y-1 py-2">
                {approvedUsers.map((approvedUser) => {
                  const projectUser = projectUsers.find(u => u.user_id === approvedUser.user_id);
                  return (
                    <div key={projectUser?.user_id} className="flex items-center justify-between px-2 rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={projectUser?.avatar as string || ""} />
                          <AvatarFallback>{getInitials(projectUser?.first_name || "", projectUser?.last_name || "")}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{projectUser?.username}</span>
                      </div>

                      <Select
                        value={approvedUser.role}
                        onValueChange={(value) =>
                          setApprovedUsers((prev) =>
                            prev.map((user) =>
                              user.user_id === approvedUser.user_id
                                ? { ...approvedUser, role: value }
                                : user
                            )
                          )
                        }
                      >
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button size="icon" variant="ghost" onClick={() => handleRemoveApprovedUser(approvedUser.user_id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button onClick={
                () => show({
                  title: "Add Project User",
                  content: () => <AddUserDialog withRole />,
                  actions: ({
                    role, selectedUser, isLoading, setSelectedUser, setSearch
                  }) => {

                    const handleAddUser = () => {
                      if (!selectedUser) return;
                      setSelectedUser(null);
                      setSearch("");
                      handleAddApprovedUser(selectedUser.user_id, role)
                    };

                    return (
                      <Button onClick={handleAddUser} disabled={!selectedUser || isLoading || selectedUser.user_id === user?.user_id} className="w-full">
                        Add User
                      </Button>
                    )
                  },
                })
              } size="sm" className="mt-1 self-end">
                <Plus className="w-4 h-4 mr-2" /> Add User
              </Button>
            </div>

            {/* Tenant users */}
            {
              project.tenant_id && (
                <div className="flex flex-col gap-2">
                  <Label>Team Users with Access</Label>
                  <div className="space-y-1 py-2">
                    {tenantUsers.map((tenantUser) => {
                      const user = projectUsers.find(u => u.user_id === tenantUser?.user_id);
                      return (
                        <div key={tenantUser.user_id} className="flex items-center justify-between px-2 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user?.avatar as string || ""} />
                              <AvatarFallback>{getInitials(user?.first_name || "", user?.last_name || "")}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user?.username || tenantUser.user_id}</span>
                          </div>

                          <Select
                            value={tenantUser.role}
                            onValueChange={(value) =>
                              setTenantUsers((prev) =>
                                prev.map((user) =>
                                  user.user_id === tenantUser.user_id
                                    ? { ...tenantUser, role: value }
                                    : user
                                )
                              )
                            }
                          >
                            <SelectTrigger size="sm" className="w-[120px]">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button size="icon" variant="ghost" onClick={() => handleRemoveTenantUser(tenantUser.user_id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Button onClick={() => show({
                    title: "Add Team User",
                    content: () => <AddUserDialog isTenantUser withRole />,
                    actions: ({
                      role, selectedUser, isLoading, setSelectedUser, setSearch
                    }) => {

                      const handleAddUser = () => {
                        if (!selectedUser) return;
                        setSelectedUser(null);
                        setSearch("");
                        handleAddTenantUser(selectedUser.user_id, role)
                      };

                      return (
                        <Button onClick={handleAddUser} disabled={!selectedUser || isLoading || selectedUser.user_id === user?.user_id} className="w-full">
                          Add Team User
                        </Button>
                      )
                    },
                  })} size="sm" className="mt-1 self-end">
                    <Plus className="w-4 h-4 mr-2" /> Add Team User
                  </Button>
                </div>
              )
            }
          </motion.div>
        )}
      </AnimatePresence>


      {/* Public toggle */}
      <div className="flex items-center justify-between border rounded-lg p-3">
        <div>
          <Label htmlFor="is-public" className="text-sm font-medium">
            Public Access
          </Label>
          <p className="text-xs text-muted-foreground">
            Anyone with the link can view and download
          </p>
        </div>
        <Switch
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
          className="flex-shrink-0"
        />
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3 mt-2">
        <div>
          <Label htmlFor="can-download" className="text-sm font-medium">
            Allow Download
          </Label>
          <p className="text-xs text-muted-foreground">
            Users with access can download folder with full resolution files
          </p>
        </div>
        <Switch
          id="can-download"
          checked={canDownload}
          onCheckedChange={setCanDownload}
          className="flex-shrink-0"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Close
        </Button>
      </div>
    </div >
  );
}

export function AddUserDialog({ isTenantUser = false, withRole = false }) {
  const { updateProps } = useDialog()

  const { searchByUsername: { mutateAsync: searchByUsername, isPending: isLoadingUser } } = useUser();
  const { currentTenant, searchByUsername: { mutateAsync: searchTenantUserByUsername, isPending: isLoadingTenantUser } } = useTenants();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = isLoadingUser || isLoadingTenantUser

  // Debounced search
  useEffect(() => {
    if (!search) {
      setSearchResults(null);
      setPopoverOpen(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const result = isTenantUser ? await searchTenantUserByUsername({ tenantId: currentTenant?.tenant_id || "", query: search }) : await searchByUsername(search);
        if (result) {
          setSearchResults(result);
          setPopoverOpen(true);
        } else {
          setSearchResults([]);
          setPopoverOpen(false);
        }
      } catch (err) {
        console.error("User search failed", err);
        setSearchResults(null);
        setPopoverOpen(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [search, searchByUsername]);

  useEffect(() => {
    updateProps({
      selectedUser,
      role,
      isLoading,
      setSelectedUser,
      setSearch,
    })
  }, [selectedUser, role, isLoading])

  return (
    <div className="space-y-4 relative w-full">
      <Popover open={!!(searchResults && popoverOpen)} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {selectedUser ? (
            <div
              onClick={() => {
                setSelectedUser(null);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser?.avatar as string} />
                <AvatarFallback className="text-xs">
                  {getInitials(selectedUser?.first_name || "", selectedUser?.last_name || "")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{selectedUser.username}</span>
            </div>
          ) : (
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search by username"
              value={search}
              autoComplete="off"
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedUser(null);
              }}
              onFocus={() => {
                if (searchResults?.length) setPopoverOpen(true);
              }}
            />
          )}
        </PopoverTrigger>

        <PopoverContent className="p-0 w-full max-h-40 overflow-y-auto pointer-events-auto">
          {searchResults && searchResults.length ? (
            searchResults.map((u) => (
              <div
                key={u.user_id}
                className={`flex items-center gap-2 p-2 cursor-pointer text-sm hover:bg-primary/20 ${selectedUser?.user_id === u.user_id ? "bg-primary/30" : ""}`}
                onClick={() => {
                  setSelectedUser(u);
                  setSearch(u.username);
                  setPopoverOpen(false);
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={u?.avatar as string} />
                  <AvatarFallback className="text-xs">
                    {getInitials(u?.first_name || "", u?.last_name || "")}
                  </AvatarFallback>
                </Avatar>
                <span>{u?.username}</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground">No users found</div>
          )}
        </PopoverContent>
      </Popover>

      {withRole && <Select value={role} onValueChange={(value) => setRole(value as "admin" | "editor" | "viewer")}>
        <SelectTrigger variant="ghost" className="h-min w-full">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>}
    </div>
  );
}