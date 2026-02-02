"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { googleApi } from "@/lib/api/googleApi";
import { useAuth } from "./useAuth";
import { useUser } from "./useUser";

export interface GoogleStorageStats {
  used: number;
  allocated: number;
  used_percent: number;
}

interface GoogleTokensFromUrl {
  google_access_token?: string;
  google_refresh_token?: string;
  google_user_email?: string;
}

export function useGoogle(tokensFromUrl?: GoogleTokensFromUrl) {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    updateUser: { mutateAsync: updateUser },
  } = useUser();

  const [googleUserInfo, setGoogleUserInfo] = useState<{
    email?: string;
  }>();

  const [token, setToken] = useState<{
    access_token: string;
    refresh_token?: string;
  }>();

  /**
   * Extract tokens from URL (after Google redirect)
   */
  useEffect(() => {
    if (!tokensFromUrl?.google_access_token) return;

    try {
      const { google_access_token, google_refresh_token, google_user_email } =
        tokensFromUrl;

      setGoogleUserInfo({ email: google_user_email });

      setToken({
        access_token: google_access_token,
        refresh_token: google_refresh_token,
      });

      if (user) {
        updateUser({
          google: {
            access_token: google_access_token,
            refresh_token: google_refresh_token,
          },
        });
      }
    } catch (err) {
      console.error("Failed to process Google tokens", err);
      toast({
        title: "Google connection failed",
        description: "Could not link your Google account.",
        variant: "destructive",
      });
    }
  }, [tokensFromUrl, user, updateUser, toast]);

  /**
   * Google OAuth URL
   */
  const authUrl = useQuery({
    queryKey: ["google", "auth-url"],
    queryFn: () => googleApi.getAuthUrl(),
    enabled: !user?.google?.access_token,
  });

  /**
   * Google Drive storage stats
   */
  const stats = useQuery<GoogleStorageStats>({
    queryKey: ["google", "stats"],
    queryFn: () => googleApi.getStats(),
    enabled: !!user?.user_id && !!user?.google?.access_token,
  });

  return {
    googleUserInfo,
    googleToken: token,
    authUrl,
    stats,
  };
}