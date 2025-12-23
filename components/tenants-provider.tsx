"use client";

import { useAuth } from "@/hooks/api/useAuth";
import { useTenants as useTenantsHook } from "@/hooks/api/useTenants";
import { Tenant } from "@/lib/api/tenantsApi";
import { createContext, useContext, useState, useMemo, ReactNode } from "react";

type TenantsContextValue = ReturnType<typeof useTenantsHook> & {
  isTenantAdmin: boolean;
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
}

const TenantsContext = createContext<TenantsContextValue | undefined>(undefined);

export function TenantsProvider({ children }: { children: ReactNode }) {
  const tenantsHook = useTenantsHook();
  const { user } = useAuth();
  const { tenants } = tenantsHook
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  const member = currentTenant?.members.find((m) => m.user_id === user?.user_id);

  // Apply filtering based on role
  const isTenantAdmin = member?.role === "admin"

  // Automatically set the first tenant as current once tenants are fetched
  // useMemo(() => {
  //   if (!currentTenant && tenants && !!tenants.length) {
  //     setCurrentTenant(tenants[0]);
  //   }
  // }, [tenants]);

  const value = useMemo(
    () => ({
      isTenantAdmin,
      currentTenant,
      setCurrentTenant,
      ...tenantsHook
    }),
    [isTenantAdmin, currentTenant, tenantsHook]
  );

  return (
    <TenantsContext.Provider value={value}>
      {children}
    </TenantsContext.Provider>
  );
}

// Hook to access Tenants context
export function useTenants() {
  const context = useContext(TenantsContext);
  if (!context) {
    throw new Error("useTenantsContext must be used within a TenantsProvider");
  }
  return context;
}
