"use client";

import { useQuery } from "@tanstack/react-query";
import { storageApi, StorageStats } from "@/lib/api/storageApi";
import { useAuth } from "./useAuth";

export function useStorage() {
  const { user } = useAuth();

  // Query for Backblaze storage stats
  const stats = useQuery<StorageStats>({
    queryKey: ["storage", "stats"],
    queryFn: () => storageApi.getStats(),
    enabled: !!user?.user_id, // only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // optional: cache for 5 minutes
  });

  return { stats };
}
