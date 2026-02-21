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
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useShares } from "@/hooks/api/useShares";
import { CreateShareDto, Share, ShareMode } from "@/types/share";
import { EditableTitle } from "./editable-title";

interface ShareDialogProps {
  project: Project;
}

export function ShareDialog({ project }: ShareDialogProps) {
  const { show } = useDialog();
  const { toast } = useToast();
  const { getShares: { data: shares, mutateAsync: getShares, isPending: isSharesLoading } } = useShares();
  const { updateProject: { mutateAsync: updateProject } } = useProjects();

  const [tenantUsers, setTenantUsers] = useState(project.approved_tenant_users || []);

  const tenatUsersQueries = useUsers(project.approved_tenant_users?.map(u => u.user_id) || []);
  const projectUsers = tenatUsersQueries?.map(u => u.data).filter(Boolean) || [];

  // Fetch shares when dialog mounts
  useEffect(() => {
    getShares({ projectId: project.project_id });
  }, [project.project_id]);


  const handleShowShareDetails = (shareId: string) => {
    const share = shares?.find(s => s.share_id === shareId)
    if (!share) return
    show({
      title: "Share Details",
      content: () => <ShareDetailsDialog share={share} onUpdate={() => getShares({ projectId: project.project_id })} />,
    })
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
            approved_tenant_users: tenantUsers,
          },
        });
        toast({ title: "Project updated", description: "Settings saved" });
      } catch {
        toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
      }
    };

    const hasChanged =
      !isSameSet(project.approved_tenant_users, tenantUsers, u => u.user_id);


    if (hasChanged) {
      update();
    }
  }, [tenantUsers]);

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

      {/* Shares list */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Shares</Label>
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {!!shares?.length ? (
            shares.map((share) => (<>
              <Button
                variant="ghost"
                key={share.share_id}
                className="w-full text-left p-2 flex justify-between items-center"
                onClick={() => handleShowShareDetails(share.share_id)}
              >
                <span className="text-xs truncate">{share.name}</span>
              </Button>
            </>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground">
              {isSharesLoading ? "Loading..." : "No shares yet"}
            </div>
          )}
        </div>
      </div>

      {/* Tenant users */}
      {project.tenant_id && (
        <>
          <div className="border-t my-4" /> {/* Separator */}
          <div className="flex flex-col gap-2">
            <Label>Team Users with Access</Label>
            <div className="space-y-1 py-2">
              {tenantUsers.map((tenantUser) => {
                const user = projectUsers.find(u => u?.user_id === tenantUser.user_id);
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

            <Button
              onClick={() =>
                show({
                  title: "Add Team User",
                  content: () => <AddUserDialog isTenantUser withRole />,
                  actions: ({ role, selectedUser, isLoading, setSelectedUser, setSearch }) => {
                    const handleAddUser = () => {
                      if (!selectedUser) return;
                      setSelectedUser(null);
                      setSearch("");
                      handleAddTenantUser(selectedUser, role);
                    };
                    return (
                      <Button
                        onClick={handleAddUser}
                        disabled={!selectedUser || isLoading}
                        className="w-full"
                      >
                        Add Team User
                      </Button>
                    );
                  },
                })
              }
              size="sm"
              className="mt-1 self-end"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Team User
            </Button>
          </div>
        </>
      )}

      {/* Close button */}
      <div className="flex gap-3 pt-4">
        <Button onClick={() =>
          show({
            content: () => <NewShareDialog projectId={project.project_id} projectName={project.name} />,
            actions: (props) => NewShareActions({ ...props, onClick: () => getShares({ projectId: project.project_id }) }),
          })
        }
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" /> New Share
        </Button>
      </div>
    </div>
  );
}

interface ShareDetailsDialogProps {
  share: Share;
  onUpdate: () => void
}

export function ShareDetailsDialog({ share, onUpdate }: ShareDetailsDialogProps) {
  const { user } = useAuth()

  const { toast } = useToast();
  const { show } = useDialog();

  const { updateShare: { mutateAsync: updateShare } } = useShares()
  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState(share.approved_emails?.map(e => ({ value: e.value, role: e.role })) || []);
  const [name, setName] = useState(share.name);
  const [newEmail, setNewEmail] = useState("");
  const [isPublic, setIsPublic] = useState(share.is_public);
  const [canDownload, setCanDownload] = useState(share.can_download);
  const [approvedUsers, setApprovedUsers] = useState(share.approved_users || []);

  const userQueries = useUsers(approvedUsers.map(u => u.user_id));
  const projectUsers = userQueries.map(u => u.data).filter(Boolean) as any[];

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied!", description: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleAddEmail = (email: string, role: "editor" | "viewer") => {
    if (!newEmail.trim()) return;
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast({ title: "Invalid email", description: "Enter a valid email", variant: "destructive" });
      return;
    }
    if (emails.map(email => email.value).includes(email)) {
      toast({ title: "Already added", description: "Email already approved" });
      return;
    }
    setEmails((emails) => [...emails, { value: email, role }]);
    setNewEmail("");
  };

  const handleUpdateEmail = (email: string, role: "editor" | "viewer") => {
    setEmails(emails.map(e => e.value === email ? { ...e, role } : e));
  }

  const handleRemoveEmail = (email: string) => setEmails(emails.filter(e => e.value !== email));

  const handleAddApprovedUser = (userId: string, role: "editor" | "viewer") => {
    if (!approvedUsers.find(u => u.user_id === userId)) {
      setApprovedUsers([...approvedUsers, { user_id: userId, role }]);
    }
  };

  const handleUpdateApprovedUser = (userId: string, role: "editor" | "viewer") => {
    setApprovedUsers(approvedUsers.map(u => u.user_id === userId ? { ...u, role } : u));
  }

  const handleRemoveApprovedUser = (userId: string) => {
    setApprovedUsers(approvedUsers.filter(u => u.user_id !== userId));
  };

  function getShareUrl() {
    return window.location.origin + share.share_url;
  }

  // Auto-update share
  useEffect(() => {
    const update = async () => {
      try {
        await updateShare({
          shareId: share.share_id,
          data: {
            name: name,
            is_public: isPublic,
            approved_emails: emails,
            can_download: canDownload,
            approved_users: approvedUsers,
          },
        });
        onUpdate()
        toast({ title: "Share updated", description: "Settings saved" });
      } catch {
        toast({ title: "Error", description: "Failed to update share", variant: "destructive" });
      }
    };

    const hasChanged =
      share.name !== name ||
      share.is_public !== isPublic ||
      share.can_download !== canDownload ||
      !isSameSet(share.approved_emails, emails, e => e.value) ||
      !isSameSet(share.approved_users, approvedUsers, u => u.user_id)

    if (hasChanged) {
      update();
    }
  }, [isPublic, name, emails, canDownload, approvedUsers]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <div className="overflow-hidden">
          <EditableTitle className="w-full" title={name} onSave={setName} />
          <p className="text-xs text-muted-foreground">Manage share settings</p>
        </div>
      </div>

      {/* Share link */}
      <AnimatePresence mode="wait">
        {share && (
          <motion.div
            key={share.share_id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-2"
          >
            <Label htmlFor="share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={getShareUrl()}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopyToClipboard(getShareUrl())}
                className={cn(
                  "shrink-0 transition-colors",
                  copied && "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approved Emails */}
      <AnimatePresence initial={false}>
        {!isPublic && emails.length > 0 && (
          <motion.div
            key="approved-emails"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.15 }, height: { duration: 0.25 } }}
            className="space-y-2 overflow-hidden"
          >
            <Label>Approved Emails</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail(newEmail, "viewer")}
              />
              <Button type="button" size="icon" onClick={() => handleAddEmail(newEmail, "viewer")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ul className="space-y-1 rounded-md border">
              {emails.map(({ value, role }) => (
                <motion.li
                  key={value}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2 text-sm"
                >
                  <span>{value}</span>

                  <div className="flex items-center">
                    <Select
                      value={role}
                      onValueChange={(value: "editor" | "viewer") => handleUpdateEmail(value, value)}
                    >
                      <SelectTrigger size="sm" className="w-[100px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="icon" variant="ghost" onClick={() => handleRemoveEmail(value)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users with Access */}
      <AnimatePresence initial={false}>
        {approvedUsers.length > 0 && (
          <motion.div
            key="approved-users"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.15 }, height: { duration: 0.25 } }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <Label>Users with Access</Label>
            <div className="space-y-1 py-2">
              {approvedUsers.map((user) => {
                const u = projectUsers.find((pu) => pu.user_id === user.user_id);
                return (
                  <motion.div
                    key={user.user_id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between px-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u?.avatar || ""} />
                        <AvatarFallback>{getInitials(u?.first_name || "", u?.last_name || "")}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{u?.username || user.user_id}</span>
                    </div>


                    <div className="flex items-center">
                      <Select
                        value={user.role}
                        onValueChange={(value: "editor" | "viewer") =>
                          handleUpdateApprovedUser(user.user_id, value)
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

                      <Button size="icon" variant="ghost" onClick={() => handleRemoveApprovedUser(user.user_id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <Button onClick={
              () => show({
                title: `Add User to ${name}`,
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <Label className="text-sm font-medium">Public Access</Label>
            <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} className="flex-shrink-0" />
        </div>

        {share.mode === "collaborative" && (
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <Label className="text-sm font-medium">Allow Download</Label>
              <p className="text-xs text-muted-foreground">Users can download files</p>
            </div>
            <Switch checked={canDownload} onCheckedChange={setCanDownload} className="flex-shrink-0" />
          </div>
        )}
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

interface NewShareDialogProps {
  projectId: string;
  projectName: string
}

export function NewShareDialog({ projectId, projectName }: NewShareDialogProps) {
  const { user } = useAuth()

  const { toast } = useToast();
  const { show, updateProps } = useDialog();

  const [name, setName] = useState(projectName);
  const [isPublic, setIsPublic] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const [emails, setEmails] = useState<{ value: string; role: "editor" | "viewer" }[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<{ user_id: string; role: "editor" | "viewer" }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [mode, setMode] = useState<ShareMode>("collaborative");

  const userQueries = useUsers(approvedUsers.map(u => u.user_id));
  const projectUsers = userQueries.map(u => u.data).filter(Boolean) as User[];

  const handleAddEmail = (email: string, role: "editor" | "viewer") => {
    if (!email.trim()) return;
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Invalid email", description: "Enter a valid email", variant: "destructive" });
      return;
    }
    if (emails.find(e => e.value === email)) {
      toast({ title: "Already added", description: "Email already approved" });
      return;
    }
    setEmails(prev => [...prev, { value: email, role }]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => setEmails(prev => prev.filter(e => e.value !== email));

  const handleAddApprovedUser = (userId: string, role: "editor" | "viewer") => {
    if (!approvedUsers.find(u => u.user_id === userId)) {
      setApprovedUsers(prev => [...prev, { user_id: userId, role }]);
    }
  };

  const handleRemoveApprovedUser = (userId: string) => setApprovedUsers(prev => prev.filter(u => u.user_id !== userId));

  useEffect(() => {
    const newShare: Partial<Share> = {
      project_id: projectId,
      name,
      is_public: isPublic,
      can_download: canDownload,
      approved_emails: emails,
      approved_users: approvedUsers,
      mode,
    };

    updateProps({ share: newShare });
  }, [name, isPublic, canDownload, emails, approvedUsers, mode, projectId]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Create New Share</h3>
          <p className="text-xs text-muted-foreground">Share this project with others</p>
        </div>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter share name" />
      </div>

      {/* Share mode */}
      <div className="space-y-2">
        <div className="flex justify-center mt-4">
          <ToggleGroup type="single" value={mode} onValueChange={(val) => setMode(val as typeof mode)}>
            <ToggleGroupItem value="collaborative">
              Collaborative
            </ToggleGroupItem>

            {/* Presentation disabled with tooltip */}
            <ToggleGroupItem value="presentation">
              Presentation
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Emails */}
      <AnimatePresence initial={false}>
        {emails.length >= 0 && (
          <motion.div
            key="emails"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.15 }, height: { duration: 0.25 } }}
            className="space-y-2 overflow-hidden"
          >
            <Label>Approved Emails</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail(newEmail, "viewer")}
              />
              <Button size="icon" onClick={() => handleAddEmail(newEmail, "viewer")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ul className="space-y-1">
              {emails.map(({ value, role }) => (
                <motion.li
                  key={value}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>{value}</span>
                  <Select
                    value={role}
                    onValueChange={(v: "editor" | "viewer") =>
                      setEmails(prev => prev.map(e => e.value === value ? { ...e, role: v } : e))
                    }
                  >
                    <SelectTrigger size="sm" className="w-[100px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveEmail(value)}>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users */}
      <AnimatePresence initial={false}>
        {approvedUsers.length >= 0 && (
          <motion.div
            key="users"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ opacity: { duration: 0.15 }, height: { duration: 0.25 } }}
            className="space-y-2 overflow-hidden"
          >
            <Label>Users with Access</Label>
            <div className="space-y-1 py-2">
              {approvedUsers.map(user => {
                const u = projectUsers.find(pu => pu.user_id === user.user_id);
                return (
                  <motion.div
                    key={user.user_id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between px-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={(u?.avatar) as string || ""} />
                        <AvatarFallback>{getInitials(u?.first_name || "", u?.last_name || "")}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{u?.username || user.user_id}</span>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(v: "editor" | "viewer") =>
                        setApprovedUsers(prev => prev.map(u2 => u2.user_id === user.user_id ? { ...u2, role: v } : u2))
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
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveApprovedUser(user.user_id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
              <Button onClick={
                () => show({
                  title: `Add User to ${name}`,
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <Label className="text-sm font-medium">Public Access</Label>
            <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>


        <AnimatePresence initial={false}>
          {mode === "collaborative" && (
            <motion.div
              key="download-switch"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Label className="text-sm font-medium">Allow Download</Label>
                  <p className="text-xs text-muted-foreground">
                    Users can download files
                  </p>
                </div>
                <Switch checked={canDownload} onCheckedChange={setCanDownload} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


interface NewShareActionsProps {
  share?: CreateShareDto;
  onClick: () => void
}

export function NewShareActions({
  share,
  onClick
}: NewShareActionsProps) {
  const { toast } = useToast();
  const { hide } = useDialog();

  const { createShare: { mutateAsync: createShare, isPending: isLoading } } = useShares();


  const handleCreateShare = async () => {
    if (!share?.name.trim()) {
      toast({
        title: "Missing name",
        description: "Enter a name for the share",
        variant: "destructive",
      });
      return;
    }

    try {
      await createShare(share);
      toast({ title: "Share created", description: "New share successfully created" });
      onClick()
      hide();
    } catch {
      toast({ title: "Error", description: "Failed to create share", variant: "destructive" });
    }
  };

  return (
    <Button
      onClick={handleCreateShare}
      disabled={!share?.name.trim() || isLoading}
      className="w-full"
    >
      Create Share
    </Button>
  );
}

