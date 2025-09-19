import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useRef, useState } from "react";

type MultiSelectProps = Omit<SelectPrimitive.SelectProps, "value"> & {
  options: { label: string | ReactNode; value: string }[];
  value: string[]; // multiple selected
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  ...props
}: MultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const el = containerRef.current;
        console.log(el)
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [value]);

  return (
    <Select
      {...props}
      disabled={disabled}
      onValueChange={(val) => {
        // Add or remove from selected values on select
        if (value.includes(val)) {
          onChange(value.filter((v) => v !== val));
        } else {
          onChange([...value, val]);
        }
      }}
    >
      <div className="relative">
        <AnimatePresence>
          <motion.div
            ref={containerRef}
            key={JSON.stringify(value)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-0 bottom-0 flex gap-1 p-2 z-10 overflow-hidden",
              className
            )}
            style={{ width: "calc(100% - 16px - 1rem)" }}
          >
            {value.length > 0 ? (
              value.map((val) => {
                const label =
                  options.find((o) => o.value === val)?.label ?? val;
                return (
                  <motion.div
                    key={val} // remount when value changes
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1 rounded bg-gray-200/10 px-2 py-0.5 text-xs"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(value.filter((v) => v !== val));
                      }}
                      className="flex items-center justify-center rounded hover:bg-red-600 hover:text-white p-0.5 transition-colors"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <span
                className={cn(
                  "text-muted-foreground pointer-events-none absolute w-full text-nowrap",
                  disabled && "text-muted-foreground/50"
                )}
              >
                {placeholder}
              </span>
            )}
            {isOverflowing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"
              />
            )}
          </motion.div>
        </AnimatePresence>
        <SelectTrigger className="relative min-h-[40px]">
          {/* Absolutely positioned tags container */}
          {/* Invisible span to maintain height and trigger functionality */}
          <span className="invisible">&nbsp;</span>
        </SelectTrigger>
      </div>

      <SelectContent>
        {options.map((option, index) => {
          const isSelected = value.includes(option.value);

          return (
            <div
              key={index}
              className="flex w-full justify-between hover:bg-gray-200/10 transition-colors duration-150 cursor-pointer relative  select-none items-center rounded-sm p-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (isSelected) {
                  onChange(value.filter((v) => v !== option.value));
                } else {
                  onChange([...value, option.value]);
                }
              }}
            >
              <span>{option.label}</span>
              {isSelected && (
                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
