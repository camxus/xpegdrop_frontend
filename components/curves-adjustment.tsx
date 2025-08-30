"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
type Handle = { x: number; y: number };
type Point = Handle;

type CurvesAdjustmentProps = {
  className?: string;
  color?: string;
  onChange?: (points: Array<Handle>) => void;
};

export default function CurvesAdjustment({
  className,
  color = "white",
  onChange,
}: CurvesAdjustmentProps) {
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([
    { x: 0, y: 1 }, // bottom-left
    { x: 1, y: 0 },
  ]);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;

    // Make canvas square
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.width; // match height to width
  }, [curveCanvasRef.current, className]);

  // 🎨 Draw grid + curve
  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const pos = (i / 4) * width;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }

    // helper to clamp values
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    // sort points
    let sorted = [...points].sort((a, b) => a.x - b.x);

    // Extend points at start (x=0) and end (x=1)
    sorted = [
      { x: 0, y: sorted[0].y },
      ...sorted,
      { x: 1, y: sorted[sorted.length - 1].y },
    ];
    onChange?.(sorted);

    // curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(sorted[0].x * width, clamp(sorted[0].y * height, 0, height));

    for (let i = 0; i < sorted.length - 1; i++) {
      const p0 = sorted[i - 1] || sorted[i];
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      const p3 = sorted[i + 2] || p2;

      if (i === 0) {
        ctx.lineTo(p2.x * width, clamp(p2.y * height, 0, height));
      } else if (i === sorted.length - 2) {
        ctx.lineTo(p2.x * width, clamp(p2.y * height, 0, height));
      } else {
        const cp1x = p1.x * width + ((p2.x - p0.x) * width) / 6;
        const cp1y = clamp(
          p1.y * height + ((p2.y - p0.y) * height) / 6,
          0,
          height
        );
        const cp2x = p2.x * width - ((p3.x - p1.x) * width) / 6;
        const cp2y = clamp(
          p2.y * height - ((p3.y - p1.y) * height) / 6,
          0,
          height
        );

        ctx.bezierCurveTo(
          cp1x,
          cp1y,
          cp2x,
          cp2y,
          clamp(p2.x * width, 0, width),
          clamp(p2.y * height, 0, height)
        );
      }
    }

    ctx.stroke();
  }, [points, curveCanvasRef, className, onChange]);

  // ➕ Add new point
  const handleAddPoint = (e: React.MouseEvent) => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPoints((prev) => [...prev, { x, y }]);
  };

  // ✋ Drag existing point
  const handleDrag = (index: number, clientX: number, clientY: number) => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setPoints((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              x: nx,
              y: ny,
            }
          : p
      )
    );
  };

  return (
    <div className={cn("relative w-full", className)}>
      <canvas
        ref={curveCanvasRef}
        className={cn(
          "w-full rounded-lg border border-white/30 bg-black/30 backdrop-blur-md"
        )}
        onClick={handleAddPoint}
      />
      {points.map((p, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute w-3 h-3 rounded-full border  cursor-grab active:cursor-grabbing"
          )}
          drag
          dragMomentum
          dragElastic={0}
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            borderColor: color,
            background: activePoint === i ? color : "transparent",
          }}
          transformTemplate={() => "translate(-50%, -50%)"}
          onDrag={(e, info) => handleDrag(i, info.point.x, info.point.y)}
          onMouseDown={() => setActivePoint(i)}
          onContextMenu={(e) => {
            e.preventDefault(); // prevent the default context menu
            setPoints((prev) => prev.filter((_, index) => index !== i));
            if (activePoint === i) setActivePoint(null);
          }}
        />
      ))}
    </div>
  );
}
