import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { ReactNode, useCallback, useState, useEffect } from "react";

interface UseGlowProps {
  children?: ReactNode;
  initialX?: number;
  initialY?: number;
  initialSize?: number;
  initialOpacity?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

export function useGlow({
  children,
  initialX = 50,
  initialY = 50,
  initialSize = 250,
  initialOpacity = 0.05,
  springConfig = { damping: 40, stiffness: 100 },
}: UseGlowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Motion values
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const gradientSize = useMotionValue(initialSize);
  const gradientOpacity = useMotionValue(initialOpacity);

  // Springs for smooth animation
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springSize = useSpring(gradientSize, { stiffness: 150, damping: 30 });
  const springOpacity = useSpring(gradientOpacity, { stiffness: 150, damping: 30 });

  // Gradient transform
  const gradient = useTransform(
    [springX, springY, springSize, springOpacity],
    ([xVal, yVal, size, opacity]) =>
      `radial-gradient(circle ${size}px at ${xVal}% ${yVal}%, 
      rgba(var(--foreground-rgb), ${opacity}) 0%, 
      rgba(var(--foreground-rgb), ${opacity as number * 0.25}) 50%, 
      transparent 100%)`
  );
  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width) * 100);
    y.set(((e.clientY - rect.top) / rect.height) * 100);
  }, []);

  // Hover effect
  useEffect(() => {
    gradientSize.set(isHovered ? 400 : 250);
    gradientOpacity.set(isHovered ? 0.2 : 0.05);
  }, [isHovered]);

  // Return a ready-to-use motion.div
  const GlowDiv: React.FC<{ children?: ReactNode }> = ({ children }) => (
    <motion.div
      className="min-h-dvh bg-background relative overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: "var(--background)",
        backgroundImage: gradient,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {children}
    </motion.div>
  );
  return { GlowDiv, setIsHovered };
}
