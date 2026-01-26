"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface EditableTitleProps extends React.InputHTMLAttributes<any> {
  title: string;
  onSave?: (newTitle: string) => void;
  editable?: boolean;
  className?: string;
}

export function EditableTitle({
  title,
  onSave,
  className,
  editable,
  ...props
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      onSave?.(editValue.trim());
    }
    setIsEditing(false);
    setEditValue(title);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // if (isEditing) {
  //   return (
  //     <div className={cn("flex items-center gap-2", className)}>
  //       <Input
  //         ref={inputRef}
  //         value={editValue}
  //         onChange={(e) => setEditValue(e.target.value)}
  //         onKeyDown={handleKeyDown}
  //         className="text-xl font-light w-fit max-w-full" // Added w-fit max-w-full
  //         {...props}
  //       />
  //       <Button size="sm" onClick={handleSave}>
  //         <Check className="h-4 w-4" />
  //       </Button>
  //       <Button size="sm" variant="outline" onClick={handleCancel}>
  //         <X className="h-4 w-4" />
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <div className={cn("flex items-center gap-2 min-h-8.5", className)}>
      <AnimatePresence initial={false} mode="wait">
        {isEditing ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-xl font-light w-fit max-w-full"
              autoFocus
            />
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 group"
          >
            <h1
              className={cn("text-2xl font-light", editable && "cursor-pointer")}
              onClick={() => editable && setIsEditing(true)}
            >
              {title}
            </h1>
            {editable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
