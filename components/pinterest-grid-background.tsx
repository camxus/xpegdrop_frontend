"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const BOX_COUNTS = 30;
const COLUMN_CLASSES = "columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4";

function randomHeight() {
  const heights = [80, 120, 160, 200, 240];
  return heights[Math.floor(Math.random() * heights.length)];
}

export function ImagesMansonryBackground() {
  // Motion values for mouse position (percent)
  const x = useMotionValue(50);
  const y = useMotionValue(50);

  const springX = useSpring(x, { damping: 40, stiffness: 100 });
  const springY = useSpring(y, { damping: 40, stiffness: 100 });

  const gradientSize = useMotionValue(250);
  const gradientOpacity = useMotionValue(0.05);

  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, { stiffness: 150, damping: 30 });

  // Compose gradient string from motion values
  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([latestX, latestY, latestSize, latestOpacity]) =>
      `radial-gradient(circle ${latestSize}px at ${latestX}% ${latestY}%, rgba(255,255,255,${latestOpacity}) 0%, rgba(255,255,255,${
        (latestOpacity as number) * 0.25
      }) 50%, transparent 100%)`
  );

  // Boxes data memoized
  const boxes = useMemo(
    () =>
      Array.from({ length: BOX_COUNTS }, (_, i) => ({
        id: i,
        height: randomHeight(),
      })),
    []
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position relative to container in px
  const [mousePosPx, setMousePosPx] = useState<{ x: number; y: number } | null>(null);

  // Mouse move handler inside container
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Update mouse pixel pos state
    setMousePosPx({ x: px, y: py });

    // Update motion values in percent for gradient
    const xPercent = (px / rect.width) * 100;
    const yPercent = (py / rect.height) * 100;
    x.set(xPercent);
    y.set(yPercent);
  }, [x, y]);

  // Find closest box to mouse for highlight
  const [hoveredBoxId, setHoveredBoxId] = useState<number | null>(null);

  useEffect(() => {
    if (!mousePosPx || !containerRef.current) {
      setHoveredBoxId(null);
      return;
    }

    const radius = 100; // px radius for highlight

    const containerRect = containerRef.current.getBoundingClientRect();
    const children = containerRef.current.children[0].children; // the boxes are in first child div

    let closestId: number | null = null;
    let closestDist = radius;

    for (let i = 0; i < boxes.length; i++) {
      const child = children[i] as HTMLElement | undefined;
      if (!child) continue;

      const rect = child.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - containerRect.left;
      const centerY = rect.top + rect.height / 2 - containerRect.top;

      const dx = centerX - mousePosPx.x;
      const dy = centerY - mousePosPx.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestId = boxes[i].id;
      }
    }

    setHoveredBoxId(closestId);
  }, [mousePosPx, boxes]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        zIndex: 0,
        filter: "grayscale(100%)",
        opacity: 0.15,
        backgroundImage: gradient.get(),
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className={`${COLUMN_CLASSES} animate-scroll-up`} style={{ willChange: "transform" }}>
        {[...boxes, ...boxes].map((box, i) => {
          const isHovered = hoveredBoxId === box.id;
          return (
            <div
              key={`${i}-${box.id}`}
              className={`mb-4 break-inside-avoid rounded-lg bg-gray-400 transition-shadow duration-300`}
              style={{
                height: box.height,
                boxShadow: isHovered
                  ? "0 0 12px 4px rgba(59, 130, 246, 0.7)"
                  : "none",
                border: isHovered ? "2px solid rgba(59,130,246,0.8)" : "none",
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
