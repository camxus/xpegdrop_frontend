"use client";

import React, { Suspense, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropletIcon as Dropbox } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useDropbox } from "@/hooks/api/useDropbox";
import Link from "next/link";

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectDropboxPage />
    </Suspense>
  );
}

export function ConnectDropboxPage() {
  const {
    authUrl: { data: authUrl },
  } = useDropbox();

  const x = useMotionValue(50);
  const y = useMotionValue(50);

  const bgX = useMotionValue(50);
  const bgY = useMotionValue(50);

  const springBgX = useSpring(bgX, { damping: 40, stiffness: 100 });
  const springBgY = useSpring(bgY, { damping: 40, stiffness: 100 });

  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  const [buttonIsHovered, setButtonIsHovered] = useState(false);
  const buttonRef = useRef(null);

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

  const handleButtonMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;
      bgX.set(xPx);
      bgY.set(yPx);
    },
    [bgX, bgY]
  );

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
          <Link href={authUrl?.url ?? ""} passHref legacyBehavior>
            <a>
              <button
                disabled={!authUrl?.url}
                ref={buttonRef}
                onMouseEnter={() => setButtonIsHovered(!!authUrl?.url)}
                onMouseLeave={() => setButtonIsHovered(false)}
                onMouseMove={handleButtonMouseMove}
                className={`
                relative overflow-hidden px-12 py-4 text-lg font-semibold
                border border-white/30 shadow-inner rounded-[9px] group transition-all duration-300 backdrop-blur-sm
                hover:border-blue-300 hover:rounded-xl
                ${
                  !authUrl
                    ? "hover:border-gray-700 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
              >
                <motion.div
                  className="absolute top-0 left-0 w-40 h-40 bg-blue-300/70 rounded-full blur-2xl pointer-events-none z-0"
                  style={{
                    x: springBgX,
                    y: springBgY,
                    translateX: "-50%",
                    translateY: "-50%",
                  }}
                  animate={{
                    opacity: buttonIsHovered ? 1 : 0,
                    scale: buttonIsHovered ? 1 : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: {
                      duration: 1,
                      delay: buttonIsHovered ? 0 : 1,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    },
                  }}
                />
                <div className="relative z-20 flex items-center gap-3">
                  <span className="bg-gradient-to-br from-white via-[#d3e4f1] to-[#a9cce3] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
                    Sign Up
                  </span>
                </div>
              </button>
            </a>
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
            <p>Secure connection • Your data stays private</p>
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
