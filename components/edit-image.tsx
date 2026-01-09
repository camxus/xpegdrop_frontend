"use client";

import React, { useRef, useEffect, useState } from "react";
import type { MediaFile } from "@/types";
import { X } from "lucide-react";
import { Slider } from "@/components/ui/slider"; // adjust import path if needed
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import CurvesAdjustment from "./curves-adjustment";
import { Button } from "./ui/button";
import _ from "lodash";
import RetouchingTools from "./retouching-tools";

interface EditImageViewProps {
  image: MediaFile;
  isOpen: boolean;
  onClose: () => void;
}

const vertexShaderSrc = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position * 2.0 - 1.0, 0, 1);
  v_texCoord = a_texCoord;
}
`;

const fragmentShaderSrc = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec2 u_texSize;

// -------------------
// Adjustments
// -------------------
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_gamma;
uniform float u_warmth;
uniform float u_tint;

// Effects
uniform float u_sharpening;
uniform float u_noiseReduction;
uniform float u_colorNoiseReduction;
uniform float u_vignette;
uniform float u_dehaze;
uniform float u_grain;

// Color adjustments
uniform float u_hue;
uniform float u_luminance;

// Curves
uniform sampler2D u_curveRGB;
uniform sampler2D u_curveR;
uniform sampler2D u_curveG;
uniform sampler2D u_curveB;

// -------------------
// Brush
// -------------------
uniform vec2 u_brushPos;   // fragCoord space
uniform float u_brushRadius;
uniform float u_brushOpacity;

// -------------------
// Helper functions
// -------------------
vec3 adjustSaturation(vec3 color, float sat) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, sat);
}

vec3 adjustHue(vec3 color, float hue) {
    float angle = hue * 3.14159265 / 180.0;
    float cosA = cos(angle);
    float sinA = sin(angle);
    mat3 hueRotation = mat3(
        vec3(0.299 + 0.701*cosA + 0.168*sinA, 0.587 - 0.587*cosA + 0.330*sinA, 0.114 - 0.114*cosA - 0.497*sinA),
        vec3(0.299 - 0.299*cosA - 0.328*sinA, 0.587 + 0.413*cosA + 0.035*sinA, 0.114 - 0.114*cosA + 0.292*sinA),
        vec3(0.299 - 0.3*cosA + 1.25*sinA, 0.587 - 0.588*cosA - 1.05*sinA, 0.114 + 0.886*cosA - 0.203*sinA)
    );
    return clamp(hueRotation * color, 0.0, 1.0);
}

vec3 adjustGamma(vec3 color, float gammaVal) { return pow(color, vec3(1.0 / gammaVal)); }
vec3 adjustWarmth(vec3 color, float warmth) { color.r += warmth*0.1; color.b -= warmth*0.1; return clamp(color,0.0,1.0); }
vec3 adjustTint(vec3 color, float tint) { color.g += tint*0.1; return clamp(color,0.0,1.0); }
vec3 adjustShadowsHighlights(vec3 color, float shadows, float highlights) { color += shadows; color += highlights; return clamp(color,0.0,1.0); }
vec3 adjustWhitesBlacks(vec3 color, float whites, float blacks) { color += whites; color += blacks; return clamp(color,0.0,1.0); }

vec3 applySharpening(sampler2D image, vec2 uv, vec2 texSize, float amount){
    vec2 px = 1.0 / texSize;
    vec3 c = texture2D(image, uv).rgb * (1.0 + 4.0*amount);
    c -= texture2D(image, uv+vec2(px.x,0)).rgb*amount;
    c -= texture2D(image, uv-vec2(px.x,0)).rgb*amount;
    c -= texture2D(image, uv+vec2(0,px.y)).rgb*amount;
    c -= texture2D(image, uv-vec2(0,px.y)).rgb*amount;
    return clamp(c,0.0,1.0);
}

vec3 applyNoiseReduction(sampler2D image, vec2 uv, vec2 texSize, float amount){
    vec2 px = 1.0 / texSize;
    vec3 sum = texture2D(image, uv).rgb;
    sum += texture2D(image, uv+vec2(px.x,0)).rgb;
    sum += texture2D(image, uv-vec2(px.x,0)).rgb;
    sum += texture2D(image, uv+vec2(0,px.y)).rgb;
    sum += texture2D(image, uv-vec2(0,px.y)).rgb;
    sum /= 5.0;
    return mix(texture2D(image, uv).rgb, sum, amount);
}

vec3 applyColorNoiseReduction(vec3 color, float amount){
    float gray = dot(color, vec3(0.299,0.587,0.114));
    return mix(color, vec3(gray), amount);
}

vec3 applyVignette(vec3 color, vec2 uv, float amount){
    vec2 center = vec2(0.5);
    float dist = distance(uv, center);
    float vign = smoothstep(0.8,0.5,dist)*amount;
    return color*(1.0 - vign);
}

vec3 applyDehaze(vec3 color, float amount){
    float darkChannel = min(min(color.r,color.g),color.b)*amount;
    return clamp(color+vec3(darkChannel),0.0,1.0);
}

float rand(vec2 co){ return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453); }
vec3 applyGrain(vec3 color, vec2 uv, float amount){ float g=(rand(uv)-0.5)*amount; return clamp(color+vec3(g),0.0,1.0); }

vec3 applyCurves(vec3 color){
    float r = texture2D(u_curveR, vec2(color.r,0.0)).r;
    float g = texture2D(u_curveG, vec2(color.g,0.0)).g;
    float b = texture2D(u_curveB, vec2(color.b,0.0)).b;
    vec3 perChannel = vec3(r,g,b);
    float gr = texture2D(u_curveRGB, vec2(perChannel.r,0.0)).r;
    float gg = texture2D(u_curveRGB, vec2(perChannel.g,0.0)).g;
    float gb = texture2D(u_curveRGB, vec2(perChannel.b,0.0)).b;
    return vec3(gr,gg,gb);
}

// -------------------
// Main
// -------------------
void main(){
    vec4 color = texture2D(u_image, v_texCoord);

    // Effects
    color.rgb += applySharpening(u_image,v_texCoord,u_texSize,u_sharpening);
    color.rgb = applyNoiseReduction(u_image,v_texCoord,u_texSize,u_noiseReduction);
    color.rgb = applyCurves(color.rgb);
    color.rgb = adjustSaturation(color.rgb,u_saturation);
    color.rgb = (color.rgb-0.5)*u_contrast+0.5+u_brightness;
    color.rgb = adjustShadowsHighlights(color.rgb,u_shadows,u_highlights);
    color.rgb = adjustWhitesBlacks(color.rgb,u_whites,u_blacks);
    color.rgb = adjustGamma(color.rgb,u_gamma);
    color.rgb = adjustWarmth(color.rgb,u_warmth);
    color.rgb = adjustTint(color.rgb,u_tint);
    color.rgb = adjustHue(color.rgb,u_hue);
    color.rgb *= u_luminance;
    color.rgb = applyColorNoiseReduction(color.rgb,u_colorNoiseReduction);
    color.rgb = applyVignette(color.rgb,v_texCoord,u_vignette);
    color.rgb = applyDehaze(color.rgb,u_dehaze);
    color.rgb = applyGrain(color.rgb,v_texCoord,u_grain);

    // -------------------
    // Brush overlay
    // -------------------
    vec2 fragPos = v_texCoord * u_texSize;
    float dist = distance(fragPos, u_brushPos);
    if(dist < u_brushRadius){
        float alpha = u_brushOpacity * (1.0 - dist/u_brushRadius);
        color.rgb = mix(color.rgb, vec3(1.0), alpha); // White brush
    }

    gl_FragColor = color;
}
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed");
  }
  return shader;
}

// Utility: create curve lookup table
export function generateCurveLUT(
  controlPoints: [number, number][],
  resolution = 256
): number[] {
  // Identity LUT by default
  const lut: number[] = new Array(resolution)
    .fill(0)
    .map((_, i) => i / (resolution - 1));
  if (controlPoints.length === 0) return lut;

  // Sort points by x
  const sorted = [...controlPoints].sort((a, b) => a[0] - b[0]);

  // Ensure first and last points are at 0 and 1
  if (sorted[0][0] > 0) sorted.unshift([0, sorted[0][1]]);
  if (sorted[sorted.length - 1][0] < 1)
    sorted.push([1, sorted[sorted.length - 1][1]]);

  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);

    // Find surrounding points
    let p1 = sorted[0];
    let p2 = sorted[sorted.length - 1];
    for (let j = 0; j < sorted.length - 1; j++) {
      if (x >= sorted[j][0] && x <= sorted[j + 1][0]) {
        p1 = sorted[j];
        p2 = sorted[j + 1];
        break;
      }
    }

    // Linear interpolation
    const t = (x - p1[0]) / (p2[0] - p1[0] || 1e-6);
    const y = p1[1] + t * (p2[1] - p1[1]);

    // Clamp to 0–1
    lut[i] = Math.min(1, Math.max(0, y));
  }

  return lut;
}

function createLUTTexture(gl: WebGLRenderingContext, lut: number[]) {
  const data = new Uint8Array(256 * 4); // RGBA for 256 values
  for (let i = 0; i < 256; i++) {
    const v = Math.floor(lut[i] * 255);
    data[i * 4 + 0] = v; // R
    data[i * 4 + 1] = v; // G
    data[i * 4 + 2] = v; // B
    data[i * 4 + 3] = 255; // A
  }

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    256,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data
  );

  return tex;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSrc: string,
  fsSrc: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error("Program linking failed");
  }
  return program;
}

export const EditImageView: React.FC<EditImageViewProps> = ({
  image,
  isOpen,
  onClose,
}) => {
  const zoomScale = 2;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL refs
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const positionBufferRef = useRef<WebGLBuffer | null>(null);
  const texCoordBufferRef = useRef<WebGLBuffer | null>(null);
  const imageTextureRef = useRef<WebGLTexture | null>(null);
  const lutTexturesRef = useRef<Record<string, WebGLTexture>>({});

  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [zoomed, setZoomed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [constraints, setConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  // -------------------
  // Basic adjustments
  // -------------------
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [gamma, setGamma] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [tint, setTint] = useState(0);

  // -------------------
  // Color adjustments
  // -------------------
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [luminance, setLuminance] = useState(100);

  // -------------------
  // Effects
  // -------------------
  const [sharpening, setSharpening] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [colorNoiseReduction, setColorNoiseReduction] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [dehaze, setDehaze] = useState(0);
  const [grain, setGrain] = useState(0);

  // Curves adjustments
  const [activeCurve, setActiveCurve] = useState<"rgb" | "r" | "g" | "b">(
    "rgb"
  );

  const sliders = [
    {
      label: "Exposure",
      val: brightness,
      set: setBrightness,
      min: 0,
      max: 200,
    },
    { label: "Contrast", val: contrast, set: setContrast, min: 50, max: 150 },
    {
      label: "Highlights",
      val: highlights,
      set: setHighlights,
      min: -100,
      max: 100,
    },
    { label: "Shadows", val: shadows, set: setShadows, min: -100, max: 100 },
    { label: "Whites", val: whites, set: setWhites, min: -100, max: 100 },
    { label: "Blacks", val: blacks, set: setBlacks, min: -100, max: 100 },
    { label: "Gamma", val: gamma, set: setGamma, min: 100, max: 500 },
    { label: "Warmth", val: warmth, set: setWarmth, min: -100, max: 100 },
    { label: "Tint", val: tint, set: setTint, min: -100, max: 100 },
    { label: "Hue", val: hue, set: setHue, min: -180, max: 180 },
    {
      label: "Saturation",
      val: saturation,
      set: setSaturation,
      min: 0,
      max: 200,
    },
    {
      label: "Luminance",
      val: luminance,
      set: setLuminance,
      min: 50,
      max: 150,
    },
    {
      label: "Sharpening",
      val: sharpening,
      set: setSharpening,
      min: 0,
      max: 100,
    },
    {
      label: "Noise Reduction",
      val: noiseReduction,
      set: setNoiseReduction,
      min: 0,
      max: 100,
    },
    {
      label: "Color Noise Reduction",
      val: colorNoiseReduction,
      set: setColorNoiseReduction,
      min: 0,
      max: 100,
    },
    { label: "Vignette", val: vignette, set: setVignette, min: -100, max: 100 },
    { label: "Dehaze", val: dehaze, set: setDehaze, min: 0, max: 100 },
    { label: "Grain", val: grain, set: setGrain, min: 0, max: 100 },
  ];

  // Load image
  useEffect(() => {
    if (!isOpen || !image?.url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    img.onload = () => {
      initWebGL(img);
    };
  }, [image, isOpen]);

  // Render WebGL
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    drawScene();
  }, [imgEl, ...sliders.map((s) => s.val)]);

  //  gl.deleteBuffer(positionBuffer);
  //   gl.deleteBuffer(texCoordBuffer);
  //   gl.deleteTexture(texture);
  //   gl.deleteProgram(program);

  const handleDragChange = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
    val: number,
    set: (v: number) => void,
    min: number,
    max: number
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startVal = val;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const step = (max - min) / 200; // sensitivity
      let newVal = startVal + delta * step;
      newVal = Math.min(Math.max(newVal, min), max);

      // Update value
      set(newVal);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const initWebGL = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;

    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
    if (!gl) return;
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);
    programRef.current = program;

    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );
    positionBufferRef.current = positionBuffer;

    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );
    texCoordBufferRef.current = texCoordBuffer;

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    imageTextureRef.current = texture;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const lut = generateCurveLUT(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ].map((p) => [p.x, p.y]),
      256
    );

    ["rgb", "r", "g", "b"].forEach((channel) =>
      createOrUpdateLUT(channel, lut)
    );

    drawScene();
  };

  const createOrUpdateLUT = (channel: string, lut: number[]) => {
    const gl = glRef.current;
    if (!gl) return;

    if (!lutTexturesRef.current[channel]) {
      lutTexturesRef.current[channel] = createLUTTexture(gl, lut);
    } else {
      // update existing texture
      gl.bindTexture(gl.TEXTURE_2D, lutTexturesRef.current[channel]);
      const data = new Uint8Array(256 * 4);
      for (let i = 0; i < 256; i++) {
        const v = Math.floor(lut[i] * 255);
        data[i * 4 + 0] = v;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        256,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data
      );
    }
  };

  const handleCurves = (
    points: { x: number; y: number }[],
    channel: "rgb" | "r" | "g" | "b"
  ) => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const lut = generateCurveLUT(
      channel === "rgb"
        ? points.map((p) => [p.x, 1 - p.y])
        : points.map((p) => [p.x, 1 - p.y]),
      256
    );

    createOrUpdateLUT(channel, lut);

    drawScene();
  };

  const drawScene = () => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");
    const uImageLoc = gl.getUniformLocation(program, "u_image");

    // Bind buffers
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTextureRef.current);
    gl.uniform1i(uImageLoc, 0);

    //Bind Sliders
    const uBrightnessLoc = gl.getUniformLocation(program, "u_brightness");
    const uContrastLoc = gl.getUniformLocation(program, "u_contrast");
    const uHighlightsLoc = gl.getUniformLocation(program, "u_highlights");
    const uShadowsLoc = gl.getUniformLocation(program, "u_shadows");
    const uWhitesLoc = gl.getUniformLocation(program, "u_whites");
    const uBlacksLoc = gl.getUniformLocation(program, "u_blacks");
    const uGammaLoc = gl.getUniformLocation(program, "u_gamma");
    const uWarmthLoc = gl.getUniformLocation(program, "u_warmth");
    const uTintLoc = gl.getUniformLocation(program, "u_tint");
    const uHueLoc = gl.getUniformLocation(program, "u_hue");
    const uSaturationLoc = gl.getUniformLocation(program, "u_saturation");
    const uLuminanceLoc = gl.getUniformLocation(program, "u_luminance");
    const uSharpeningLoc = gl.getUniformLocation(program, "u_sharpening");
    const uNoiseReductionLoc = gl.getUniformLocation(
      program,
      "u_noiseReduction"
    );
    const uColorNoiseReductionLoc = gl.getUniformLocation(
      program,
      "u_colorNoiseReduction"
    );
    const uVignetteLoc = gl.getUniformLocation(program, "u_vignette");
    const uDehazeLoc = gl.getUniformLocation(program, "u_dehaze");
    const uGrainLoc = gl.getUniformLocation(program, "u_grain");

    // Set all uniforms
    gl.uniform1i(uImageLoc, 0);
    gl.uniform1f(uBrightnessLoc, brightness / 1000);
    gl.uniform1f(uContrastLoc, contrast / 100);
    gl.uniform1f(uHighlightsLoc, highlights / 1000);
    gl.uniform1f(uShadowsLoc, shadows / 1000);
    gl.uniform1f(uWhitesLoc, whites / 1000);
    gl.uniform1f(uBlacksLoc, blacks / 1000);
    gl.uniform1f(uGammaLoc, gamma / 100);
    gl.uniform1f(uWarmthLoc, warmth / 100);
    gl.uniform1f(uTintLoc, tint / 100);
    gl.uniform1f(uHueLoc, hue);
    gl.uniform1f(uSaturationLoc, saturation / 100);
    gl.uniform1f(uLuminanceLoc, luminance / 100);
    gl.uniform1f(uSharpeningLoc, sharpening / 1000);
    gl.uniform1f(uNoiseReductionLoc, noiseReduction / 1000);
    gl.uniform1f(uColorNoiseReductionLoc, colorNoiseReduction / 1000);
    gl.uniform1f(uVignetteLoc, vignette / 1000);
    gl.uniform1f(uDehazeLoc, dehaze / 1000);
    gl.uniform1f(uGrainLoc, grain / 1000);

    // Bind LUTs
    !_.isEmpty(lutTexturesRef.current) &&
      ["r", "g", "b", "rgb"].forEach((ch) => {
        const tex = lutTexturesRef.current[ch];
        if (tex) {
          const loc = gl.getUniformLocation(
            program,
            `u_curve${ch.toUpperCase()}`
          );
          gl.activeTexture(
            gl[
              `TEXTURE${ch === "rgb" ? 1 : ch === "r" ? 2 : ch === "g" ? 3 : 4}`
            ]
          );
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform1i(
            loc,
            ch === "rgb" ? 1 : ch === "r" ? 2 : ch === "g" ? 3 : 4
          );
        }
      });

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;

      const containerRect = container.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // When zoomed, the canvas scales up
      const scaledWidth = canvasRect.width * zoomScale;
      const scaledHeight = canvasRect.height * zoomScale;

      const maxX = (scaledWidth - containerRect.width) / 2;
      const maxY = (scaledHeight - containerRect.height) / 2;

      setConstraints({
        top: -maxY,
        bottom: maxY,
        left: -maxX,
        right: maxX,
      });
    }
  }, [zoomed]);

  useEffect(() => {
    if (!isOpen) {
      // Reset WebGL refs
      const gl = glRef.current;
      if (gl) {
        // Delete LUT textures
        Object.values(lutTexturesRef.current).forEach((tex) =>
          gl.deleteTexture(tex)
        );
        lutTexturesRef.current = {};

        // Delete image texture
        if (imageTextureRef.current) {
          gl.deleteTexture(imageTextureRef.current);
          imageTextureRef.current = null;
        }

        // Delete buffers
        if (positionBufferRef.current)
          gl.deleteBuffer(positionBufferRef.current);
        if (texCoordBufferRef.current)
          gl.deleteBuffer(texCoordBufferRef.current);

        // Delete program
        if (programRef.current) gl.deleteProgram(programRef.current);
        programRef.current = null;

        glRef.current = null;
      }

      // Reset states
      setImgEl(null);
      setZoomed(false);
      setIsDragging(false);
      setConstraints({ top: 0, left: 0, right: 0, bottom: 0 });

      // Reset adjustments
      setBrightness(100);
      setContrast(100);
      setHighlights(0);
      setShadows(0);
      setWhites(0);
      setBlacks(0);
      setGamma(100);
      setWarmth(0);
      setTint(0);
      setHue(0);
      setSaturation(100);
      setLuminance(100);
      setSharpening(0);
      setNoiseReduction(0);
      setColorNoiseReduction(0);
      setVignette(0);
      setDehaze(0);
      setGrain(0);

      // Reset curve
      setActiveCurve("rgb");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
      >
        <motion.div
          className={cn(
            "border rounded max-w-full max-h-full",
            zoomed ? "cursor-grab" : "cursor-zoom-in"
          )}
          onClick={() => {
            if (!isDragging) {
              setZoomed((prev) => !prev);
            }
          }}
          style={{ display: "inline-block", overflow: "hidden" }}
          animate={{
            scale: zoomed ? zoomScale : 1,
            x: zoomed ? undefined : 0,
            y: zoomed ? undefined : 0, // reset to center when zoomed out
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag={zoomed}
          dragConstraints={constraints}
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDragEnd={() => {
            setTimeout(() => {
              setIsDragging(false);
            }, 50);
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          <canvas ref={canvasRef} />
        </motion.div>
      </div>

      {/* Sidebar */}
      <div
        className="w-64 p-4 flex flex-col gap-4 overflow-auto 
  bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-white"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Adjustments</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        {sliders.map(({ label, val, set, min, max }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-white text-sm">{label}</label>
            <div className="flex items-center gap-2">
              <Input
                className="text-xs cursor-col-resize w-16"
                onMouseDown={(e) => handleDragChange(e, val, set, min, max)}
                value={val.toFixed(0)}
              />
              <Slider
                className="bg-white/5"
                min={min}
                max={max}
                value={val}
                onValueChange={(v: number) => set(v)}
              />
            </div>
          </div>
        ))}
        <div className="flex gap-2 ml-auto">
          <div
            className="cursor-pointer rounded-full p-2 bg-white"
            onClick={() => setActiveCurve("rgb")}
          />
          <div
            className="cursor-pointer rounded-full p-2 bg-red-400"
            onClick={() => setActiveCurve("r")}
          />
          <div
            className="cursor-pointer rounded-full p-2 bg-green-400"
            onClick={() => setActiveCurve("g")}
          />
          <div
            className="cursor-pointer rounded-full p-2 bg-blue-400"
            onClick={() => setActiveCurve("b")}
          />
        </div>

        <div className="relative w-full">
          <CurvesAdjustment
            color="white"
            className={
              activeCurve === "rgb"
                ? "block"
                : "absolute top-0 opacity-0 pointer-events-none"
            }
            onChange={(points) => handleCurves(points, "rgb")}
          />
          <CurvesAdjustment
            color="red"
            className={
              activeCurve === "r"
                ? "block"
                : "absolute top-0 opacity-0 pointer-events-none"
            }
            onChange={(points) => handleCurves(points, "r")}
          />
          <CurvesAdjustment
            color="green"
            className={
              activeCurve === "g"
                ? "block"
                : "absolute top-0 opacity-0 pointer-events-none"
            }
            onChange={(points) => handleCurves(points, "g")}
          />
          <CurvesAdjustment
            color="blue"
            className={
              activeCurve === "b"
                ? "block"
                : "absolute top-0 opacity-0 pointer-events-none"
            }
            onChange={(points) => handleCurves(points, "b")}
          />
        </div>
        <RetouchingTools glRef={glRef} canvasRef={canvasRef} />
      </div>
    </div>
  );
};
