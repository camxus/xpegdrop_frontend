"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { referralsApi, Referral } from "@/lib/api/referralsApi";
import { useToast } from "../use-toast";
import { useAuth } from "./useAuth";
import { ApiError } from "next/dist/server/api-utils";

export function useReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
  * Fetch referrals for the current user
  */
  const { data: referrals, refetch } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      return await referralsApi.getUserReferrals();
    },
    enabled: !!user?.user_id,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  /**
   * Create a new referral (limit: 5)
   */
  const createReferral = useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error("User not logged in");
      return await referralsApi.createReferral();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      toast({
        title: "Referral created",
        description: `New referral code: ${data.code}`,
      });
    },
    onError: (err: any) => {
      console.error("Create referral error:", err);
      toast({
        title: "Error",
        description: "Failed to create referral",
        variant: "destructive",
      });
    },
  });

  /**
   * Redeem a referral code
   */
  const redeemReferral = useMutation({
    mutationFn: async (code: string) => {
      return await referralsApi.redeemReferral(code);
    },
    onSuccess: (data) => {
      toast({
        title: "Referral redeemed",
        description: `You successfully redeemed referral code ${data.code}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
    onError: (err: any) => {
      console.error("Redeem referral error:", err);
      toast({
        title: "Error",
        description: "Failed to redeem referral",
        variant: "destructive",
      });
    },
  });

  /**
   * Check a referral code (exists and not redeemed)
   */
  const checkReferral = useMutation({
    mutationFn: async (code: string) => {
      if (!code) throw new Error("Referral code is required");
      return await referralsApi.checkReferral(code);
    },
    onError: (err: any) => {
      // Handle specific API error codes
      const apiError = (err as ApiError)?.message
      let message = "Failed to check referral";

      if (apiError === "NOT_FOUND") {
        message = "Referral code not found";
      } else if (apiError === "ALREADY_REDEEMED") {
        message = "This referral code has already been redeemed";
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  return {
    referrals,
    createReferral,
    redeemReferral,
    checkReferral,
  };
}
