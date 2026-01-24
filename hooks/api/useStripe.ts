"use client";

import { useQuery } from "@tanstack/react-query";
import { stripeApi } from "@/lib/api/stripeApi";

export function useStripe() {
  const billingInfo = useQuery({
    queryKey: ["billingInfo"],
    queryFn: stripeApi.getBillingInfo,
  });

  const billingPortal = useQuery({
    queryKey: ["billingPortal"],
    queryFn: stripeApi.getBillingPortalUrl,
  });


  return {
    billingInfo,
    billingPortal,
  };
}
