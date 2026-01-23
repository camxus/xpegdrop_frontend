"use client";

import { createContext, useState, type ReactNode, type FC, RefAttributes } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogOptions {
  id?: string;
  open?: boolean;
  title?: string;
  description?: string;
  content?: FC<any>;
  contentProps?: Record<string, unknown>;
  actions?: FC<any>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

interface DialogContextType {
  show: (options: DialogOptions) => void;
  hide: () => void;
  updateProps: (newProps: Record<string, unknown>) => void;
}

export const DialogContext = createContext<DialogContextType | undefined>(
  undefined
);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<DialogOptions[]>([]);

  const show = (options: Omit<DialogOptions, "id" | "open">) => {
    setStack((prev) => [
      ...prev,
      { ...options, id: crypto.randomUUID(), open: true },
    ]);
  };

  const hide = () => {
    setStack((prev) => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        { ...last, open: false },
      ];
    });
  };

  const updateProps = (newProps: Record<string, unknown>) => {
    setStack((prev) => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];
      const updated = {
        ...last,
        contentProps: {
          ...last.contentProps,
          ...newProps,
        },
      };

      return [...prev.slice(0, -1), updated];
    });
  };

  return (
    <DialogContext.Provider value={{ show, hide, updateProps }}>
      {children}

      {stack.map((dialogOptions, index) => {
        const Component = dialogOptions.content;
        const Actions = dialogOptions.actions;

        return (
          <Dialog
            key={dialogOptions.id}
            open={dialogOptions.open}
            onOpenChange={(open) => {
              if (!open) {
                setStack((prev) =>
                  prev.filter((d) => d.id !== dialogOptions.id)
                );
              }
            }}
          >
            <DialogContent
              {...dialogOptions.containerProps}
              className={cn(
                "overflow-hidden flex flex-col",
                dialogOptions.containerProps?.className
              )}
              style={{
                maxHeight: "calc(100vh - 4rem)",
                ...dialogOptions.containerProps?.style,
                // Optional: visual depth
                transform: `translateY(${index * 4}px)`,
              }}
            >
              {dialogOptions.title && (
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>{dialogOptions.title}</DialogTitle>
                  {dialogOptions.description && (
                    <DialogDescription>
                      {dialogOptions.description}
                    </DialogDescription>
                  )}
                </DialogHeader>
              )}

              <div className="flex-1 overflow-y-auto">
                {Component ? <Component {...dialogOptions.contentProps} /> : null}
              </div>

              {Actions && (
                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                  <Actions {...dialogOptions.contentProps} />
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        );
      })}
    </DialogContext.Provider>
  );
}
