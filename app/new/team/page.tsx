"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUploader } from "@/components/ui/file-uploader";
import { Edit2, Upload } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useTenants } from "@/components/tenants-provider";
import { S3Location, User } from "@/types/user";
import { getInitials } from "@/lib/utils";
import { useDialog } from "@/hooks/use-dialog";
import { TenantUsersTable } from "@/app/preferences/tenant/[handle]/page";
import { Member, Tenant } from "@/lib/api/tenantsApi";
import { useAuth } from "@/hooks/api/useAuth";
import UpgradePage from "@/app/upgrade/page";

const fadeInVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function NewTeamWizard() {
    const { user } = useAuth();
    const { show, hide } = useDialog();
    const {
        createTenant: { mutateAsync: createTenant },
        getTenantByHandle: { mutateAsync: getTenantByHandle, data: foundTenant, isPending: isCheckingHandle }
    } = useTenants()
    const [step, setStep] = useState(1);

    const [tenantData, setTenantData] = useState<{
        name: string;
        handle: string;
        description: string;
        avatar?: File | null;
        members: Tenant["members"]
    }>({
        name: "",
        handle: "",
        description: "",
        avatar: null,
        members: [],
    });

    const [tenantUsers, setTenantUsers] = useState<User[]>([])
    const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)


    const nextStep = () => setStep((s) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const handleChangeSelectedMemberRoles = (userIds: string[], newRole: Tenant['members'][number]["role"]) => {
        setTenantUsers((prev) => ({
            ...prev,
            members: prev.map((m) =>
                userIds.includes(m.user_id) ? { ...m, role: newRole } : m
            ),
        }));
    };

    const handleRemoveSelectedMembers = (userIds: string[]) => {
        setTenantUsers((prev) => ({
            ...prev,
            members: prev.filter((m) => !userIds.includes(m.user_id)),
        }));
    };

    const handleAddMemberMember = (user: User) => {
        if (tenantData.members.some((m) => m.user_id === user.user_id))
            setTenantUsers((prev) => ({
                ...prev,
                user,
            }));
    };

    const handleCreateTeam = async () => {
        console.log("Creating team", tenantData);
        await createTenant(tenantData)
    };

    const handleAvatarClick = () => {
        show({
            title: "Update Tenant Avatar",
            content: () => {
                const [avatarFile, setAvatarFile] = useState<File | null>(null);

                const handleConfirm = async () => {
                    if (!avatarFile) return;

                    try {
                        const compressed = await imageCompression(avatarFile, {
                            maxSizeMB: 4,
                            maxWidthOrHeight: 1024,
                            useWebWorker: true,
                        });

                        setTenantData((tenantData) => ({ ...tenantData, avatar: compressed }))

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

    // Debounce username input
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (tenantData.handle.length > 0) {
                getTenantByHandle(tenantData.handle);
            } else {
                setHandleAvailable(null);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [tenantData.handle]);

    useEffect(() => {
        if (!tenantData.handle.length) setHandleAvailable(null);
        else if (foundTenant) setHandleAvailable(false);
        else if (!isCheckingHandle && !foundTenant) setHandleAvailable(true);
    }, [foundTenant, tenantData.handle, isCheckingHandle]);



    useEffect(() => {
        setTenantData((prev) => ({
            ...prev,
            members: tenantUsers.map((user) => {
                return new Member(user.user_id)
            })
            ,
        }));
    }, [tenantUsers])

    if (!user) {
        <div className="w-full h-full">
            <div className="flex items-center justify-center h-[80vh]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            </div>
        </div>
    }

    if (user.membership?.membership_id !== "agency") {
        return <UpgradePage />
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                className="max-w-xl mx-auto p-6 space-y-6"
            >
                <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    variants={fadeInVariants}
                >
                    <motion.h1 className="text-3xl font-bold">
                        {tenantData.name ? tenantData.name : "New Team"}
                    </motion.h1>

                    <div className="relative inline-block group" onClick={handleAvatarClick}>
                        <Avatar className="h-20 w-20 cursor-pointer">
                            <AvatarImage src={tenantData.avatar || undefined} />
                            <AvatarFallback className="text-xl">
                                {getInitials(tenantData.name, "") || "NT"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <Edit2 className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div variants={fadeInVariants} className="space-y-4">
                                <Label>Team Name</Label>
                                <Input
                                    value={tenantData.name}
                                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                                />

                                <Label>Handle</Label>
                                <Input
                                    className={`text-sm ${handleAvailable === null
                                        ? "text-gray-400"
                                        : handleAvailable
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                    value={tenantData.name}
                                    onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                                />

                                <Label>Description</Label>
                                <Input
                                    type="textarea"
                                    value={tenantData.description}
                                    onChange={(e) => setTenantData({ ...tenantData, description: e.target.value })}
                                />
                            </motion.div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div variants={fadeInVariants} className="space-y-4">
                                <TenantUsersTable
                                    tenant={undefined}
                                    users={tenantUsers}
                                    onChangeRoleSelected={(userIds, newRole) => handleChangeSelectedMemberRoles(userIds, newRole as unknown as Tenant["members"][number]["role"])}
                                    onDeleteSelected={handleRemoveSelectedMembers}
                                    onInvite={handleAddMemberMember} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.div variants={fadeInVariants} className="flex justify-between mt-6">
                    {step > 1 && <Button variant="outline" onClick={prevStep}>Back</Button>}
                    {step < 1 ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <Button onClick={handleCreateTeam}>Create Team</Button>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
