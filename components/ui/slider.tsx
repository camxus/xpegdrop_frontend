"use client";

import * as React from "react";
import * as RSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  className,
  min,
  max,
  value,
  onValueChange,
}) => {
  return (
    <RSlider.Root
      className={cn(
        "relative flex items-center select-none touch-none w-full h-5",
        "group"
      )}
      min={min}
      max={max}
      value={[value]}
      onValueChange={(val) => onValueChange(val[0])}
    >
      <RSlider.Track
        className={cn(
          "relative bg-gray-700 h-1 flex-1 rounded-full",
          className
        )}
      >
        <RSlider.Range className="absolute bg-white h-full rounded-full" />
      </RSlider.Track>
      <RSlider.Thumb className="transition-all cursor-pointer block w-2 h-2 hover:h-2.5 hover:w-4 bg-white rounded-full shadow-md hover:bg-gray-200 focus:outline-none" />
    </RSlider.Root>
  );
};
