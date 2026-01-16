"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "./ui/slider";

const MOBILE_HEIGHT = "80vh";

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {
}

export function VideoPlayer({
  className,
  onLoadedData,
  ...videoProps
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  /* ---------------- controls visibility ---------------- */
  const showControls = () => {
    setControlsVisible(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => setControlsVisible(false), 1000);
  };

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  /* ---------------- video actions ---------------- */
  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleSeek = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolume = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = value / 100;
    setVolume(value);
    setMuted(value === 0);
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  /* ---------------- video events ---------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(video.currentTime);
    const onMeta = () => setDuration(video.duration);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  /* ---------------- render ---------------- */
  return (
    <div
      className="relative max-w-full max-h-full flex items-center justify-center"
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onTouchStart={showControls}
    >
      <div className="relative w-full">
        <video
          ref={videoRef}
          {...videoProps}
          controls={false}
          className={cn(
            "max-w-full w-auto h-auto object-contain transition-opacity duration-300",
            `max-h-${MOBILE_HEIGHT}`,
            className
          )}
          onClick={togglePlay}
          onLoadedData={onLoadedData}
        />

        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 backdrop-blur p-3 space-y-2"
            >
              {/* Slider for video seek */}
              <Slider
                min={0}
                step={0.01}
                max={duration || 0}
                value={currentTime}
                onValueChange={handleSeek}
              />

              <div className="flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="cursor-pointer">
                    {isPlaying ? <Pause /> : <Play />}
                  </button>

                  <button onClick={toggleMute} className="cursor-pointer">
                    {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
                  </button>

                  {/* Slider for volume */}
                  <div className="w-20">
                    <Slider
                      min={0}
                      max={100}
                      value={muted ? 0 : volume}
                      onValueChange={handleVolume}
                    />
                  </div>
                </div>

                <button onClick={handleFullscreen} className="cursor-pointer">
                  <Maximize />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
