"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  RefreshTokenRequest,
  type LoginRequest,
  type SignupRequest,
} from "@/lib/api/authApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TOKEN_KEY } from "@/lib/api/token";
import { removeCookieClient, setCookieClient } from "@/lib/cookie";
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage";
import { User } from "@/types/user";

const AUTH_USER_KEY = "user";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Get user profile if authenticated
  const { data: user } = useQuery<User | null>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      // Intentionally empty — won't run unless refetched
      return getLocalStorage(AUTH_USER_KEY);
    },
    // enabled: false, // prevents auto-fetch
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      // After successful signup, redirect to login
      router.push("/login");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create account");
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setCookieClient(TOKEN_KEY, JSON.stringify(data.token));
      setLocalStorage(AUTH_USER_KEY, data.user);

      // After successful login, update auth state and redirect to dashboard
      queryClient.setQueryData(["auth", "check"], { authenticated: true });
      queryClient.setQueryData(["auth", "profile"], data.user);
    },
    onError: (error: any) => {
      setError(error.message || "Invalid username or password");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => Promise.resolve(null),
    onSuccess: () => {
      removeCookieClient(TOKEN_KEY);

      // After successful logout, clear auth state and redirect to home
      queryClient.setQueryData(["auth", "check"], { authenticated: false });
      queryClient.setQueryData(["auth", "profile"], null);
      router.refresh();
    },
    onError: () => {
      // Even if logout fails, clear local state
      queryClient.setQueryData(["auth", "check"], { authenticated: false });
      queryClient.setQueryData(["auth", "profile"], null);
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: (data) => {
      if (data) {
        setCookieClient(TOKEN_KEY, JSON.stringify(data));
      }

      queryClient.setQueryData(["auth", "check"], { authenticated: true });
      queryClient.setQueryData(["auth", "profile"], data.user);
    },
    onError: (error: any) => {
      setError("Session expired. Please log in again.");
      logout(); // Clear state and redirect
    },
  });

  // Forgot Password mutation (starts the reset flow, e.g. sends reset code/email)
  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      // You could show a success message or route user to confirmation page
    },
    onError: (error: any) => {
      setError(error.message || "Failed to start password reset");
    },
  });

  // Confirm Password mutation (confirms the code sent to the user)
  const confirmPasswordMutation = useMutation({
    mutationFn: authApi.confirmPassword,
    onSuccess: () => {
      // e.g. redirect to login or show success
    },
    onError: (error: any) => {
      setError(error.message || "Failed to confirm password reset");
    },
  });

  // Set New Password mutation (set new password after confirmation)
  const setNewPasswordMutation = useMutation({
    mutationFn: authApi.setNewPassword,
    onSuccess: () => {
      // e.g. redirect to login or show success
    },
    onError: (error: any) => {
      setError(error.message || "Failed to set new password");
    },
  });

  // Signup function
  const signup = async (data: SignupRequest) => {
    setError(null);
    try {
      await signupMutation.mutateAsync(data);
    } catch (error: any) {
      setError(error.message || "Invalid username or password");
      throw error; // <-- this will throw to the caller
    }
  };

  // Login function
  const login = async (data: LoginRequest) => {
    setError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      setError(error.message || "Invalid username or password");
      throw error; // <-- this will throw to the caller
    }
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  const refresh = (data: RefreshTokenRequest) => {
    refreshTokenMutation.mutate(data);
  };
  // Forgot password function
  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email });
    } catch (error: any) {
      setError(error.message || "Failed to start password reset");
      throw error;
    }
  };

  // Confirm password function
  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    setError(null);
    try {
      await confirmPasswordMutation.mutateAsync({ email, code, newPassword });
    } catch (error: any) {
      setError(error.message || "Failed to confirm password reset");
      throw error;
    }
  };

  // Set new password function
  const setNewPassword = async (email: string, newPassword: string) => {
    setError(null);
    try {
      await setNewPasswordMutation.mutateAsync({ email, newPassword });
    } catch (error: any) {
      setError(error.message || "Failed to set new password");
      throw error;
    }
  };

  return {
    user,
    error,

    signup,
    login,
    logout,
    refresh,

    forgotPassword,
    confirmPassword,
    setNewPassword,

    isSigningUp: signupMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    isForgettingPassword: forgotPasswordMutation.isPending,
    isConfirmingPassword: confirmPasswordMutation.isPending,
    isSettingNewPassword: setNewPasswordMutation.isPending,
  };
}
