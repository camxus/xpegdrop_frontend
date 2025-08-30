"use client";

import React, { useState, useEffect, useRef } from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";

interface RetouchingToolsProps {
  glRef: React.MutableRefObject<WebGLRenderingContext | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

type BrushMode = "paint" | "clone" | "heal";

export default function RetouchingTools({ glRef, canvasRef }: RetouchingToolsProps) {
  const [brushSize, setBrushSize] = useState(50);
  const [brushOpacity, setBrushOpacity] = useState(50);
  const [brushColor, setBrushColor] = useState<"white" | "black">("white");
  const [brushMode, setBrushMode] = useState<BrushMode>("paint");
  const cloneSource = useRef<{ x: number; y: number } | null>(null);

  // Update WebGL brush uniforms
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    if (!program) return;

    const uBrushRadiusLoc = gl.getUniformLocation(program, "u_brushRadius");
    const uBrushOpacityLoc = gl.getUniformLocation(program, "u_brushOpacity");

    if (uBrushRadiusLoc) gl.uniform1f(uBrushRadiusLoc, brushSize);
    if (uBrushOpacityLoc) gl.uniform1f(uBrushOpacityLoc, brushOpacity / 100);
  }, [brushSize, brushOpacity, glRef.current]);

  // Brush application
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (brushMode === "clone") {
        // Set source point
        cloneSource.current = { x, y };
      } else {
        applyBrush(x, y);
      }

      canvas.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      applyBrush(x, y);
    };

    const handlePointerUp = () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [brushSize, brushOpacity, brushColor, brushMode, glRef.current]);

  const applyBrush = (x: number, y: number) => {
    const gl = glRef.current;
    if (!gl) return;

    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    if (!program) return;

    // Set brush uniforms
    const uBrushPosLoc = gl.getUniformLocation(program, "u_brushPos");
    const uBrushColorLoc = gl.getUniformLocation(program, "u_brushColor");
    const uModeLoc = gl.getUniformLocation(program, "u_brushMode");
    const uCloneSourceLoc = gl.getUniformLocation(program, "u_cloneSource");

    if (uBrushPosLoc) gl.uniform2f(uBrushPosLoc, x, y);
    if (uBrushColorLoc)
      gl.uniform3fv(uBrushColorLoc, brushColor === "white" ? [1, 1, 1] : [0, 0, 0]);
    if (uModeLoc)
      gl.uniform1i(
        uModeLoc,
        brushMode === "paint" ? 0 : brushMode === "heal" ? 1 : 2
      );
    if (uCloneSourceLoc && cloneSource.current)
      gl.uniform2f(uCloneSourceLoc, cloneSource.current.x, cloneSource.current.y);

    // Render a single brush stroke (could be a fullscreen quad in shader)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      <h3 className="text-sm font-bold">Retouching Brush</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs">Size</label>
        <div className="flex items-center gap-2">
          <Input
            className="w-16 text-xs"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
          <Slider min={1} max={200} value={brushSize} onValueChange={setBrushSize} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs">Opacity</label>
        <div className="flex items-center gap-2">
          <Input
            className="w-16 text-xs"
            value={brushOpacity}
            onChange={(e) => setBrushOpacity(Number(e.target.value))}
          />
          <Slider
            min={1}
            max={100}
            value={brushOpacity}
            onValueChange={setBrushOpacity}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded text-xs ${
            brushColor === "white" ? "bg-white text-black" : "bg-gray-700"
          }`}
          onClick={() => setBrushColor("white")}
        >
          White
        </button>
        <button
          className={`px-2 py-1 rounded text-xs ${
            brushColor === "black" ? "bg-black text-white" : "bg-gray-700"
          }`}
          onClick={() => setBrushColor("black")}
        >
          Black
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          className={`px-2 py-1 rounded text-xs ${
            brushMode === "paint" ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => setBrushMode("paint")}
        >
          Paint
        </button>
        <button
          className={`px-2 py-1 rounded text-xs ${
            brushMode === "clone" ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => setBrushMode("clone")}
        >
          Clone
        </button>
        <button
          className={`px-2 py-1 rounded text-xs ${
            brushMode === "heal" ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => setBrushMode("heal")}
        >
          Heal
        </button>
      </div>
    </div>
  );
}
