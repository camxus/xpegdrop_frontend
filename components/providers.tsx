"use client";

import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { DialogProvider } from "@/components/dialog-provider";
import { Toaster } from "./ui/toaster";
import { ModalProvider } from "./modal-provider";
import { TenantsProvider } from "./tenants-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ModalProvider>
          <DialogProvider>
            <TenantsProvider>
              {children}
            </TenantsProvider>
          </DialogProvider>
        </ModalProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
