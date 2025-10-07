"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  maxLength?: number;
  autoResize?: boolean;
  resizable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLength, autoResize = true, resizable = true, ...props }, externalRef) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    const combinedRef = (el: HTMLTextAreaElement) => {
      if (typeof externalRef === "function") externalRef(el);
      else if (externalRef) (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      internalRef.current = el;
    };

    const [inputLength, setInputLength] = React.useReducer(
      () => internalRef.current?.value.length || 0,
      internalRef.current?.value.length || 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = "auto"; // reset height
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`; // set to scrollHeight
      }
      setInputLength();
      props.onChange?.(e);
    };

    const currentLength = internalRef.current?.value.length || 0;
    const isMaxed = maxLength !== undefined && currentLength >= maxLength;

    return (
      <div className="relative w-full">
        <textarea
        {...props}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            !resizable && "resize-none",
            isMaxed && "text-red-500",
            className
          )}
          ref={combinedRef}
          maxLength={maxLength}
          onChange={handleChange}
        />
        {maxLength !== undefined && (
          <div
            className={cn(
              "absolute bottom-1 right-3 text-xs",
              isMaxed ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
