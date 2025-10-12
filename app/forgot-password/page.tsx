"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/api/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as yup from "yup";
import { useRouter } from "next/navigation";

export const confirmPasswordSchema = yup.object().shape({
  email: yup.string().email().required("Email is required"),
  code: yup.string().required("Confirmation code is required"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Must include at least one lowercase letter")
    .matches(/[A-Z]/, "Must include at least one uppercase letter")
    .matches(/[0-9]/, "Must include at least one number")
    .required("New password is required"),
  verifyPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { forgotPassword, confirmPassword } = useAuth();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the confirmation code.",
      });
      setStep("confirm");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await confirmPasswordSchema.validate(
        { email, code: confirmationCode, newPassword, verifyPassword },
        { abortEarly: false }
      );

      await confirmPassword(email, confirmationCode, newPassword);

      toast({
        title: "Password reset successful",
        description: "You can now sign in with your new password.",
      });
      router.push("/login")
    } catch (err: any) {
      if (err.name === "ValidationError") {
        const validationErrors: Record<string, string> = {};
        err.inner.forEach((e: yup.ValidationError) => {
          if (e.path) validationErrors[e.path] = e.message;
        });
        setErrors(validationErrors);
      } else {
        toast({
          title: "Error",
          description: err?.message || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  switch (step) {
    case "request":
      return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  Forgot Password
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your email to receive a reset code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      email
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                      placeholder="john@fframess.com"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
                    disabled={isSubmitting}
                  >
                    Send Reset Email
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Remember your password?{" "}
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

    case "confirm":
      return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">
                  Reset Password
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter the code and your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmationCode" className="text-white">
                      Confirmation Code
                    </Label>
                    <Input
                      id="confirmationCode"
                      type="text"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                      placeholder="Enter code"
                    />
                    {errors.code && (
                      <p className="text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                      placeholder="New password"
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-600">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verifyPassword" className="text-white">
                      Confirm New Password
                    </Label>
                    <Input
                      id="verifyPassword"
                      type="password"
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                      placeholder="Confirm password"
                    />
                    {errors.verifyPassword && (
                      <p className="text-sm text-red-600">
                        {errors.verifyPassword}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20"
                    disabled={isSubmitting}
                  >
                    Reset Password
                  </Button>
                  <div className="mt-2 text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setStep("request")}
                      className="text-white underline hover:text-gray-200"
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );

    default:
      return null;
  }
}
