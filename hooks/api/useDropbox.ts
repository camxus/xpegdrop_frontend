"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { dropboxApi } from "@/lib/api/dropboxApi";
import { useAuth } from "./useAuth";

interface DropboxTokenPayload {
  access_token: string;
  refresh_token: string;
  account_id: string;
  exp?: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface DropboxStorageStats {
  storage: {
    used: number;
    allocated: number;
    used_percent: number;
  };
}

export function useDropbox() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth()

  const [dropboxUserInfo, setDropboxUserInfo] = useState<Partial<DropboxTokenPayload>>()
  const [token, setToken] = useState<{
    access_token: string;
    refresh_token: string;
  }>();

  // Extract token from URL if available
  useEffect(() => {
    const tokenFromUrl = searchParams.get("dropbox_token");

    if (tokenFromUrl) {
      try {
        const decoded = jwtDecode<DropboxTokenPayload>(tokenFromUrl);

        if (
          decoded.exp &&
          decoded.exp * 1000 < Date.now() &&
          !decoded.access_token &&
          !decoded.refresh_token
        ) {
          console.warn("Dropbox token has expired");
          toast({
            title: "Dropbox token expired",
            description: "Please reconnect your Dropbox account.",
            variant: "destructive",
          });
          return;
        }

        setDropboxUserInfo({email: decoded.email, first_name: decoded.first_name, last_name: decoded.last_name})

        setToken({
          access_token: decoded.access_token,
          refresh_token: decoded.refresh_token,
        });
      } catch (err) {
        console.error("Invalid Dropbox token", err);
        toast({
          title: "Invalid token",
          description: "Dropbox token is invalid or malformed.",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, toast]);

  // Query for Dropbox auth URL
  const authUrl = useQuery({
    queryKey: ["dropbox", "auth-url"],
    queryFn: () => dropboxApi.getAuthUrl(),
    enabled: false,
  });

  // Query for Dropbox storage stats
  const stats = useQuery<DropboxStorageStats>({
    queryKey: ["dropbox", "stats"],
    queryFn: () => dropboxApi.getStats(),
    enabled: !!user?.user_id,
  });

  return {
    dropboxUserInfo,
    dropboxToken: token,
    stats,
    authUrl,
  };
}
