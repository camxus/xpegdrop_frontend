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
  title?: string;
  description?: string;
  content?: FC<any>;
  contentProps?: Record<string, unknown>;
  actions?: FC<any>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>
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
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOptions, setDialogOptions] = useState<DialogOptions>({});

  const show = (options: DialogOptions) => {
    setDialogOptions(options);
    setIsOpen(true);
  };

  const hide = () => {
    setIsOpen(false);
    setDialogOptions({});
  };

  const updateProps = (newProps: Record<string, unknown>) => {
    setDialogOptions((prev) => ({
      ...prev,
      contentProps: {
        ...prev.contentProps,
        ...newProps,
      },
    }));
  };

  const Component = dialogOptions.content;
  const Actions = dialogOptions.actions;

  return (
    <DialogContext.Provider value={{ show, hide, updateProps }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          {...dialogOptions.containerProps}
          className={cn("overflow-hidden flex flex-col", dialogOptions.containerProps?.className)}
          style={{ maxHeight: "calc(100vh - 4rem)", ...dialogOptions.containerProps?.style }}
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
          {dialogOptions.actions && (
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              {Actions ? <Actions {...dialogOptions.contentProps} /> : null}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}
