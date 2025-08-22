"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, Eye, EyeOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/api/useAuth";
import { FileUploader } from "@/components/ui/file-uploader";
import { useDropbox } from "@/hooks/api/useDropbox";
import ConnectDropboxPage from "../page";
import { useUsers } from "@/hooks/api/useUsers";
import imageCompression from "browser-image-compression";
import * as yup from "yup";

export type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  bio: string;
  dropbox:
    | {
        access_token: string;
        refresh_token: string;
      }
    | undefined;
};

const step1Schema = yup.object().shape({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  username: yup.string().required("Username is required"),
});

const fullSchema = yup.object().shape({
  first_name: yup.string().required(),
  last_name: yup.string().required(),
  email: yup.string().email().required(),
  username: yup.string().required(),
  password: yup.string().min(6).required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")])
    .required(),
  bio: yup.string().optional(),
  avatar_file: yup.mixed().required(),
  dropbox: yup.object({
    access_token: yup.string().required(),
    refresh_token: yup.string().required(),
  }),
});

export default function SignUpPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageContent />
    </Suspense>
  );
}

export function SignUpPageContent() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    bio: "",
    dropbox: { access_token: "", refresh_token: "" },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const { signup, isSigningUp, error } = useAuth();
  const {
    getUserByUsername: {
      mutateAsync: getUserByUsername,
      isPending: isCheckingUsername,
      data: foundUser,
    },
  } = useUsers();
  const { dropboxToken } = useDropbox();
  const router = useRouter();

  // Sync Dropbox token
  useEffect(() => {
    if (!dropboxToken) return;
    setFormData((prev) => ({ ...prev, dropbox: dropboxToken }));
  }, [dropboxToken]);

  // Debounce username input
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.username.length > 0) {
        getUserByUsername(formData.username);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData.username]);

  useEffect(() => {
    if (!formData.username.length) setUsernameAvailable(null);
    else if (foundUser) setUsernameAvailable(false);
    else if (!isCheckingUsername && !foundUser) setUsernameAvailable(true);
  }, [foundUser, formData.username, isCheckingUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      try {
        const options = {
          maxSizeMB: 4,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setAvatarFile(compressedFile);
      } catch (err) {
        console.error("Image compression error:", err);
      }
    }
  };

  const goNext = async () => {
    try {
      await step1Schema.validate(formData, { abortEarly: false });
      setFormErrors({});
      setStep(2);
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.inner.forEach((e: any) => {
        if (e.path) errors[e.path] = e.message;
      });
      setFormErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fullSchema.validate(
        { ...formData, avatar_file: avatarFile },
        { abortEarly: false }
      );
      setFormErrors({});
      await signup({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        username: formData.username,
        bio: formData.bio || undefined,
        dropbox: formData.dropbox,
        avatar_file: avatarFile,
      });
      router.push("/login");
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.inner?.forEach((e: any) => {
        if (e.path) errors[e.path] = e.message;
      });
      setFormErrors(errors);
    }
  };

  if (!dropboxToken) return <ConnectDropboxPage />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-white mr-2" />
              <CardTitle className="text-2xl text-white">Gallery</CardTitle>
            </div>
            <CardDescription className="text-gray-300">
              Create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-white">
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                          placeholder="John"
                        />
                        {formErrors.first_name && (
                          <p className="text-sm text-red-400">
                            {formErrors.first_name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-white">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                          placeholder="Doe"
                        />
                        {formErrors.last_name && (
                          <p className="text-sm text-red-400">
                            {formErrors.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                        placeholder="john@example.com"
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-400">
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                        placeholder="johndoe"
                      />
                      {formErrors.username && (
                        <p className="text-sm text-red-400">
                          {formErrors.username}
                        </p>
                      )}
                      {formData.username && (
                        <p
                          className={`text-sm ${
                            usernameAvailable === null
                              ? "text-gray-400"
                              : usernameAvailable
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {isCheckingUsername
                            ? "Checking availability..."
                            : usernameAvailable
                            ? "Username available"
                            : "Username already taken"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          className="bg-white/10 text-white border-white/20 placeholder:text-gray-400 pr-10"
                          placeholder="Password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {formErrors.password && (
                          <p className="text-sm text-red-400">
                            {formErrors.password}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="bg-white/10 text-white border-white/20 placeholder:text-gray-400 pr-10"
                          placeholder="Confirm Password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {formErrors.confirmPassword && (
                          <p className="text-sm text-red-400">
                            {formErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
                      onClick={goNext}
                    >
                      Next
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="avatar" className="text-white">
                        Profile Image
                      </Label>
                      <div className="flex w-full justify-center">
                        {!avatarFile ? (
                          <FileUploader
                            onFilesSelected={handleAvatarUpload}
                            accept={{ "image/*": [".jpeg", ".jpg", ".png"] }}
                            maxFiles={1}
                            className="w-40 h-40 rounded-lg border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center text-white/70">
                              <Upload className="h-8 w-8 mb-2" />
                              <span className="text-sm">Upload Image</span>
                            </div>
                          </FileUploader>
                        ) : (
                          <div className="relative">
                            <img
                              className="w-40 h-40 rounded-lg object-cover"
                              src={
                                URL.createObjectURL(avatarFile) ||
                                "/placeholder.svg"
                              }
                              alt="Avatar preview"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                              onClick={() => setAvatarFile(undefined)}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-1/2 text-white border-white/20 hover:bg-white/10"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="cursor-pointer w-1/2 bg-white/20 hover:bg-white/30 text-white border-white/20"
                        disabled={
                          isSigningUp ||
                          !formData.username ||
                          usernameAvailable === false
                        }
                      >
                        {isSigningUp ? "Creating..." : "Create Account"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-white underline hover:text-gray-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
