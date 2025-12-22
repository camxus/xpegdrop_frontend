"use client";

import { useState, useEffect, use, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Upload, Edit2, ArrowLeft, MoreHorizontal } from "lucide-react";
import { FileUploader } from "@/components/ui/file-uploader";
import imageCompression from "browser-image-compression";
import { useDialog } from "@/hooks/use-dialog";
import Link from "next/link";
import { motion } from "framer-motion";
import { getInitials } from "@/lib/utils";
import { useTenants } from "@/components/tenants-provider";
import { Tenant } from "@/lib/api/tenantsApi";
import { useParams } from "next/navigation";
import { useUser, useUsers } from "@/hooks/api/useUser";
import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { blurFadeInVariants, staggeredContainerVariants } from "@/lib/motion";

export default function TenantPreferencesPage() {
    const { handle } = useParams<{ handle: string }>();

    const { updateTenant, getTenantByHandle: { mutateAsync: getTenantByHandle, data: tenant } } = useTenants();

    const userQueries = useUsers(tenant?.members.map(member => member.user_id) || [])

    const uniqueUsers = Array.from(
        new Map(userQueries.map((user) => [user.data?.user_id, user.data])).values()
    ).filter(user => !!user);

    const { show, hide } = useDialog();

    const [tenantState, setTenantState] = useState<Tenant>(tenant!);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // --- Auto-save tenant updates (name, description)
    useEffect(() => {
        if (!tenant) return;

        if (
            tenantState.name === tenant.name &&
            tenantState.description === tenant.description
        ) {
            return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(() => {
            updateTenant.mutateAsync({
                tenantId: tenant.tenant_id,
                data: {
                    name: tenantState.name,
                    description: tenantState.description ?? ""
                },
            }).catch(console.error);
        }, 800);

        setDebounceTimer(timer);

        return () => clearTimeout(timer);
    }, [tenantState]);

    // --- Avatar update dialog
    const handleAvatarClick = () => {
        show({
            title: "Update Tenant Avatar",
            content: () => {
                const [avatarFile, setAvatarFile] = useState<File | null>(null);

                const handleConfirm = async () => {
                    if (!avatarFile || !tenant) return;

                    try {
                        const compressed = await imageCompression(avatarFile, {
                            maxSizeMB: 4,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                        });

                        await updateTenant.mutateAsync({
                            tenantId: tenant.tenant_id,
                            data: { avatar: compressed },
                        });

                        hide();
                    } catch (err) {
                        console.error("Avatar update failed", err);
                    }
                };

                return (
                    <div className="space-y-4">
                        <FileUploader
                            onFilesSelected={(files) => setAvatarFile(files[0])}
                            accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
                            maxFiles={1}
                            className="border-dashed border p-4 rounded"
                        >
                            <div className="flex flex-col items-center justify-center">
                                <Upload className="h-6 w-6 mb-2" />
                                <span>Drag & drop or click to upload</span>
                            </div>
                        </FileUploader>

                        <Button onClick={handleConfirm} disabled={!avatarFile} className="w-full">
                            Confirm
                        </Button>
                    </div>
                );
            },
        });
    };

    useEffect(() => {
        getTenantByHandle(handle)
    }, [handle])

    if (!tenant || !tenantState) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        </div>
    );

    return (
        <motion.div
            variants={staggeredContainerVariants}
            initial="hidden"
            animate="show"
            className="p-8 max-w-4xl mx-auto"
        >
            <Link href="/preferences">
                <Button variant="ghost" className="mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </Link>

            {/* Header */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-4xl font-bold">{tenantState.name}</h2>

                <div className="relative inline-block group" onClick={handleAvatarClick}>
                    <Avatar className="h-20 w-20 cursor-pointer">
                        <AvatarImage src={tenantState.avatar as string} />
                        <AvatarFallback className="text-xl">
                            {getInitials(tenantState.name, "")}
                        </AvatarFallback>
                    </Avatar>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Edit2 className="h-5 w-5 text-white" />
                    </div>
                </div>
            </motion.div>

            {/* Editable fields */}
            <motion.div className="space-y-4" variants={staggeredContainerVariants}>
                <motion.div variants={blurFadeInVariants} className="space-y-2">
                    <Label htmlFor="name" className="text-muted-foreground">Name</Label>
                    <Input
                        id="name"
                        value={tenantState.name}
                        onChange={(e) =>
                            setTenantState((prev) => ({ ...prev, name: e.target.value }))
                        }
                    />
                </motion.div>

                <motion.div variants={blurFadeInVariants} className="space-y-2">
                    <Label htmlFor="name" className="text-muted-foreground">Handle</Label>
                    <Input
                        id="name"
                        value={tenantState.handle}
                        disabled
                        onChange={(e) =>
                            setTenantState((prev) => ({ ...prev, handle: e.target.value }))
                        }
                    />
                </motion.div>

                <motion.div variants={blurFadeInVariants} className="space-y-2">
                    <Label htmlFor="description" className="text-muted-foreground">Description</Label>
                    <Input
                        id="description"
                        value={tenantState.description || ""}
                        onChange={(e) =>
                            setTenantState((prev) => ({ ...prev, description: e.target.value }))
                        }
                    />
                </motion.div>

                <motion.div className="mt-8" variants={blurFadeInVariants}>
                    <Label className="text-2xl font-semibold mb-4">Members</Label>

                    <TenantUsersTable tenant={tenant} users={uniqueUsers} />
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

interface TenantUsersTableProps {
    tenant?: Tenant;
    users: User[];
    onDeleteSelected?: (selected: string[]) => void
    onChangeRoleSelected?: (selected: string[], newRole: string) => void
    onInvite?: (selectedUser: User) => void
}


export function TenantUsersTable({ tenant, users, onDeleteSelected, onChangeRoleSelected, onInvite }: TenantUsersTableProps) {
    const { removeMember, updateMember } = useTenants()
    const [rowSelection, setRowSelection] = useState<Record<number, any>>({});
    // Map users with their tenant membership info
    const data = users
        .map((user) => {
            const member = tenant?.members.find((m) => m.user_id === user.user_id);
            if (!member) return null;
            return {
                id: user.user_id, // for selection tracking
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: member.role,
                joinedAt: member.joined_at && new Date(member.joined_at).toLocaleDateString(),
            };
        })
        .filter(Boolean) as {
            id: string;
            name: string;
            email: string;
            role: string;
            joinedAt: string;
        }[];

    const selectedData = data.filter((_, idx) => !!rowSelection[idx])

    // Define columns
    const columns: ColumnDef<typeof data[number]>[] = [
        {
            id: "select",
            header: ({ table }) => {
                return (
                    <Checkbox
                        disabled={!(table.getRowCount())}
                        checked={table.getIsAllRowsSelected()}
                        onClick={() => table.toggleAllRowsSelected()}
                        aria-label="Select all"
                    />
                )
            },
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onClick={() => row.toggleSelected()}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableColumnFilter: false,
            size: 24,
        },
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row, getValue, column }) => {
                const value = getValue<string>();

                return (
                    <Select value={value} onValueChange={(value: "admin" | "viewer" | "editor") => handleChangeRoleSelected([row.original], value)}>
                        <SelectTrigger variant="ghost" className="w-32 h-min">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteSelected([row.original])} className="text-destructive-foreground">
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableSorting: false,
            enableColumnFilter: false,
        },
    ];

    // Mass actions handlers
    const handleDeleteSelected = async (rows: typeof data) => {
        onDeleteSelected?.(data.map((item) => item.id))
        if (!tenant) return
        await Promise.all(
            rows.map((row) =>
                removeMember.mutateAsync({
                    tenantId: tenant.tenant_id,
                    userId: row.id,
                })
            )
        );

        setRowSelection({});
    };

    const handleChangeRoleSelected = async (rows: typeof data, newRole: "admin" | "viewer" | "editor") => {
        onChangeRoleSelected?.(rows.map((item) => item.id), newRole)
        if (!tenant) return
        await Promise.all(
            rows.map((row) =>
                updateMember.mutateAsync({
                    tenantId: tenant.tenant_id,
                    userId: row.id,
                    role: newRole,
                })
            )
        );
    };

    return (
        <div>
            <InviteMemberButton tenant={tenant} onInvite={onInvite} />

            {/* Mass Actions Toolbar */}
            <div className="mb-4 flex gap-2 justify-end w-full">
                <Select disabled={!selectedData.length} onValueChange={(value: "admin" | "viewer" | "editor") => handleChangeRoleSelected(selectedData, value)}>
                    <SelectTrigger className="w-32 h-min bg-primary text-background hover:bg-primary/90">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    onClick={() => handleDeleteSelected(selectedData)}
                    disabled={!selectedData.length}
                    className="px-3 py-1 rounded"
                >
                    Delete
                </Button>
            </div>


            {/* Table */}
            <DataTable
                {...{ rowSelection, setRowSelection }}
                columns={columns}
                data={data}
            />
        </div>
    );
}


export function InviteMemberButton({ tenant, onInvite }: { tenant?: Tenant, onInvite?: (selectedUser: User) => void }) {
    const { show } = useDialog();

    return (
        <Button
            onClick={() =>
                show({
                    title: "Invite Member",
                    content: () => <InviteMemberDialog tenantId={tenant?.tenant_id} onInvite={onInvite} />,
                })
            }
        >
            Invite Member
        </Button>
    );
}

const InviteMemberDialog = ({ tenantId, onInvite }: { tenantId?: string, onInvite?: (selectedUser: User) => void }) => {
    const { hide } = useDialog();

    const { inviteMember } = useTenants();
    const { searchByUsername } = useUser();

    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<User[] | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        if (!search) {
            setSearchResults(null);
            setPopoverOpen(false);
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const result = await searchByUsername.mutateAsync(search);

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
    }, [search]);

    const handleInvite = async () => {
        if (!selectedUser) return
        onInvite?.(selectedUser)
        if (!tenantId) return;
        setLoading(true);

        try {
            await inviteMember.mutateAsync({
                tenantId,
                data: { user_id: selectedUser.user_id, role },
            });
            hide();
        } catch (err) {
            console.error("Failed to invite member", err);
        } finally {
            setLoading(false);
            setPopoverOpen(false);
        }
    };

    return (<div className="space-y-4 relative w-full" >
        <Popover open={!!(searchResults && popoverOpen)} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                {selectedUser ? (
                    <div
                        onClick={() => {
                            setSelectedUser(null);

                            // wait a bit so React renders the Input
                            requestAnimationFrame(() => {
                                inputRef.current?.focus();
                            });
                        }}
                        className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent"
                    >
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser?.avatar as string} />
                            <AvatarFallback className="text-xs">
                                {getInitials(selectedUser?.first_name || "", "")}
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
                            className={`flex items-center gap-2 p-2 cursor-pointer text-sm hover:bg-primary/20 ${selectedUser?.user_id === u.user_id ? "bg-primary/30" : ""
                                }`}
                            onClick={() => {
                                setSelectedUser(u);
                                setSearch(u.username);
                                setPopoverOpen(false);
                            }}
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={u?.avatar as string} />
                                <AvatarFallback className="text-xs">
                                    {getInitials(u?.first_name || "", "")}
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

        < Select value={role} onValueChange={(value: "admin" | "viewer" | "editor") => setRole(value as "admin" | "editor" | "viewer")}>
            <SelectTrigger variant="ghost" className="h-min w-full" >
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            < SelectContent >
                <SelectItem value="admin" > Admin </SelectItem>
                < SelectItem value="editor" > Editor </SelectItem>
                < SelectItem value="viewer" > Viewer </SelectItem>
            </SelectContent>
        </Select>

        < Button onClick={handleInvite} disabled={loading || !selectedUser} className="w-full" >
            {loading ? "Inviting..." : "Invite"}
        </Button>
    </div>)
};