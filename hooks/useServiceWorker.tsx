"use client"

import { useEffect, useState } from "react";

interface UseServiceWorkerOptions {
  swUrl?: string; // path to service worker file
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: any) => void;
}

export function useServiceWorker({
  swUrl = process.env.NODE_ENV === "production" ? "/sw.build.js" : "/sw.js",
  onRegistered,
  onError,
}: UseServiceWorkerOptions = {}) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      setIsSupported(true);

      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          setRegistration(reg);
          onRegistered?.(reg);
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
          onError?.(err);
        });

      // Optional: listen for updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service worker controller changed.");
      });
    }
  }, [swUrl, onRegistered, onError]);

  return { registration, isSupported };
}
