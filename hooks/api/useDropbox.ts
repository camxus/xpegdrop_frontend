"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { dropboxApi } from "@/lib/api/dropboxApi";

interface DropboxTokenPayload {
  access_token: string;
  refresh_token: string;
  account_id: string;
  exp?: number;
}

export function useDropbox() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState<{
    access_token: string;
    refresh_token: string;
  }>();

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

  const getDropboxAuthUrl = () =>
    useQuery({
      queryKey: ["dropbox", "auth-url"],
      queryFn: () => dropboxApi.getAuthUrl(),
    });

  return {
    dropboxToken: token,
    getDropboxAuthUrl,
  };
}
