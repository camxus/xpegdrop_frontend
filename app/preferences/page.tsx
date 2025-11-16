"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/api/useUser";
import { useAuth } from "@/hooks/api/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit2, Upload } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { FileUploader } from "@/components/ui/file-uploader";
import imageCompression from "browser-image-compression";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { User } from "@/types/user";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4 } },
};


export default function PreferencesPage() {
  const { user } = useAuth();
  const { updateUser } = useUser();
  const { show, hide } = useDialog();

  const [userState, setUserState] = useState<User>(user!);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounce effect to update userState changes
  useEffect(() => {
    if (!userState || !user) return;

    if (
      userState.first_name === user.first_name &&
      userState.last_name === user.last_name
    ) {
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      updateUser.mutateAsync({
        first_name: userState.first_name,
        last_name: userState.last_name,
      }).catch(console.error);
    }, 800); // 800ms debounce

    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [userState]);

  const handleAvatarClick = () => {
    show({
      title: "Update Avatar",
      content: () => {
        const [avatarFile, setAvatarFile] = useState<File | null>(null);

        const handleConfirm = async () => {
          if (!avatarFile) return;

          try {
            const options = {
              maxSizeMB: 4,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
            };
            const compressedFile = await imageCompression(avatarFile, options);
            await updateUser.mutateAsync({ avatar: compressedFile });
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

            <Button
              onClick={handleConfirm}
              disabled={!avatarFile}
              className="w-full"
            >
              Confirm
            </Button>
          </div>
        );
      },
    });
  };

  if (!user || !userState) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 max-w-4xl mx-auto"
    >
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>
      {/* Greeting + Avatar */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold">Hi, {userState.first_name}</h2>
        <div className="relative inline-block group" onClick={handleAvatarClick}>
          <Avatar className="h-20 w-20 cursor-pointer">
            <AvatarImage src={userState?.avatar as string} />
            <AvatarFallback className="text-xl">
              {getInitials(userState?.first_name || "", userState?.last_name || "")}
            </AvatarFallback>
          </Avatar>

          {/* Edit icon appears on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Edit2 className="h-5 w-5 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Editable user details */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="space-y-1">
          <Label htmlFor="first_name" className="text-muted-foreground">First Name</Label>
          <Input
            id="first_name"
            value={userState.first_name}
            onChange={(e) => setUserState((prev) => ({ ...prev, first_name: e.target.value }))}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="last_name" className="text-muted-foreground">Last Name</Label>
          <Input
            id="last_name"
            value={userState.last_name}
            onChange={(e) => setUserState((prev) => ({ ...prev, last_name: e.target.value }))}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <Label htmlFor="email" className="text-muted-foreground">Email</Label>
          <Input
            id="email"
            value={user?.email}
            disabled
          />
        </motion.div>
      </motion.div>

      {/* Manage Billing */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="mt-8"
      >
        <Link href="/billing">
          <Button variant="default">Manage Billing</Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
