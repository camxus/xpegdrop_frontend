"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getCheckoutSession } from "@/app/actions/stripe";
import PricingCard from "@/components/pricing-card";
import { PRODUCTS } from "@/lib/products";

export function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!sessionId || !planId) {
        router.replace("/upgrade");
        return;
      }

      const prod = PRODUCTS.find((p) => p.id === planId);
      if (!prod) {
        router.replace("/upgrade");
        return;
      }

      await getCheckoutSession(sessionId); // Validate session via server action
      setProduct(prod);
      setLoading(false);
    }

    load();
  }, [sessionId, planId, router]);

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  const isAnnual = !!planId?.includes("annual");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
          </div>

          <p className="text-lg text-muted-foreground mb-2">
            You successfully upgraded to{" "}
            <span className="font-semibold">{product.name}</span>
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-center">
            You now have access to these features:
          </h2>
          <div className="max-w-md mx-auto">
            <PricingCard
              name={product.name}
              desc={product.description}
              features={product.features}
              monthly={product.monthly}
              annual={product.annual}
              link=""
              buttonText="Active Plan"
              primary
              showAnnualBilling={isAnnual}
              setShowAnnualBilling={() => { }}
            />
          </div>
        </div>

        <div className="text-center">
          <a href="/billing" className="text-primary hover:underline font-medium">
            Manage your billing →
          </a>
        </div>
      </div>
    </div>
  );
}


export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
