"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stripeApi } from "@/lib/api/stripeApi";
import { useToast } from "@/hooks/use-toast";

export function useStripe() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const billingInfo = useQuery({
    queryKey: ["billingInfo"],
    queryFn: stripeApi.getBillingInfo,
  });

  const billingPortal = useMutation({
    mutationFn: stripeApi.getBillingPortalUrl,
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: "Failed to open portal",
          description: "No portal URL returned from server.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to open portal",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });


  return {
    billingInfo,
    billingPortal,
  };
}
