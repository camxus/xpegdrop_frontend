"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { DropletIcon as Dropbox } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useDropbox } from "@/hooks/api/useDropbox";
import Link from "next/link";
import GlowingButton from "@/components/glowing-button";

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectDropboxPage />
    </Suspense>
  );
}

export function ConnectDropboxPage() {
  const {
    authUrl: { data: authUrl, refetch: fetchAuthUrl },
  } = useDropbox();

  const x = useMotionValue(50);
  const y = useMotionValue(50);

  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  const gradientSize = useMotionValue(250);
  const gradientOpacity = useMotionValue(0.05);
  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, {
    stiffness: 150,
    damping: 30,
  });

  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([latestX, latestY, latestSize, latestOpacity]) =>
      `radial-gradient(circle ${latestSize}px at ${latestX}% ${latestY}%, rgba(255,255,255,${latestOpacity}) 0%, rgba(255,255,255,${
        (latestOpacity as number) * 0.25
      }) 50%, transparent 100%)`
  );

  const handleGlobalMouseMove = useCallback(
    (e: React.MouseEvent<any>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      x.set(xPercent);
      y.set(yPercent);
    },
    [x, y]
  );

  useEffect(() => {
    fetchAuthUrl();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center"
      onMouseMove={handleGlobalMouseMove}
      style={{
        backgroundColor: "var(--background)",
        backgroundImage: gradient,
        backgroundAttachment: "fixed",
        backgroundPosition: `${springX.get()}% ${springY.get()}%`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <motion.div
          className="flex flex-col text-center gap-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Sign Up button */}
          <Link href={"/signup"}>
            <GlowingButton>Sign Up</GlowingButton>
          </Link>

          {/* Login prompt */}
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" legacyBehavior>
              <a className="text-blue-400 hover:underline font-semibold cursor-pointer">
                Login
              </a>
            </Link>
          </p>

          <motion.div
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p>Secure connection • Your data stays yours</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        Powered by Dropbox
      </div>
    </motion.div>
  );
}
