"use client";

import React, { ReactNode, useCallback, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function GlowingButton(props: { children: ReactNode }) {
  const [buttonIsHovered, setButtonIsHovered] = useState(false);

  const x = useMotionValue(50);
  const y = useMotionValue(50);

  // Spring background movement
  const springX = useSpring(x, { stiffness: 120, damping: 20 });
  const springY = useSpring(y, { stiffness: 120, damping: 20 });

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

  return (
    <button
      className="cursor-pointer relative overflow-hidden px-12 py-4 text-lg font-semibold
                border border-white/30 shadow-inner rounded-[9px] group transition-all duration-300 backdrop-blur-sm
                hover:border-blue-300 hover:rounded-xl"
      onMouseEnter={() => setButtonIsHovered(true)}
      onMouseLeave={() => setButtonIsHovered(false)}
      onMouseMove={handleGlobalMouseMove}
    >
      {/* Animated blur background */}
      <motion.div
        className="absolute top-0 left-0 w-40 h-40 bg-blue-300/70 rounded-full blur-2xl pointer-events-none z-0"
        style={{
          x: springX,
          y: springY,
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

      {/* Text layer */}
      <div className="relative z-20 flex items-center gap-3">
        <span className="bg-gradient-to-br from-white via-[#d3e4f1] to-[#a9cce3] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
          {props.children}
        </span>
      </div>
    </button>
  );
}
