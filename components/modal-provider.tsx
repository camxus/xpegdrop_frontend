"use client";

import {
  createContext,
  useState,
  type ReactNode,
  type FC,
  useEffect,
} from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Enum for modal positions
export enum Position {
  TOP = "top",
  BOTTOM = "bottom",
  LEFT = "left",
  RIGHT = "right",
}

interface ModalOptions {
  title?: string;
  content?: FC<any>;
  contentProps?: Record<string, unknown>;
  actions?: FC<any>;
  width?: string; // for left/right
  height?: string; // for top/bottom
  position?: Position;
  containerStyle?: React.CSSProperties;
}

interface ModalContextType {
  show: (options: ModalOptions) => void;
  hide: () => void;
  updateProps: (newProps: Record<string, unknown>) => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined
);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // For CSS animations
  const [modalOptions, setModalOptions] = useState<ModalOptions>({});

  const show = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
    setTimeout(() => setIsVisible(true), 10); // trigger animation
  };

  const hide = () => {
    setIsVisible(false);
  };

  const updateProps = (newProps: Record<string, unknown>) => {
    setModalOptions((prev) => ({
      ...prev,
      contentProps: {
        ...prev.contentProps,
        ...newProps,
      },
    }));
  };

  const Component = modalOptions.content;
  const Actions = modalOptions.actions;
  const position: Position = modalOptions.position || Position.RIGHT;

  const width = modalOptions.width
    ? `min(${modalOptions.width}, 100vw)` // never exceed viewport width
    : "400px";
  const height = modalOptions.height
    ? `min(${modalOptions.height}, 100vh)` // never exceed viewport height
    : "300px";

  // Base style
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease, opacity 0.3s ease",
    maxHeight: "100vh",
    maxWidth: "100vw",
  };

  if (position === Position.LEFT || position === Position.RIGHT) {
    baseStyle.top = 0;
    baseStyle[position] = 0;
    baseStyle.height = "100%";
    baseStyle.width = width;
    baseStyle.transform = isVisible
      ? "translateX(0)"
      : position === Position.RIGHT
        ? "translateX(100%)"
        : "translateX(-100%)";
  } else {
    baseStyle.left = 0;
    baseStyle[position] = 0;
    baseStyle.width = "100%";
    baseStyle.height = height;
    baseStyle.transform = isVisible
      ? "translateY(0)"
      : position === Position.BOTTOM
        ? "translateY(100%)"
        : "translateY(-100%)";
  }

  const style = { ...baseStyle, ...modalOptions.containerStyle };

  // Clean up after exit animation
  useEffect(() => {
    if (!isVisible && isOpen) {
      const timer = setTimeout(() => setIsOpen(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, isOpen]);

  return (
    <ModalContext.Provider value={{ show, hide, updateProps }}>
      {children}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
              }`}
            style={{ zIndex: 40 }}
            onClick={hide}
          />

          {/* Modal Panel */}
          <div className={cn("bg-background/70 backdrop-blur-lg border-white/10",
            position === Position.TOP && "border-b",
            position === Position.BOTTOM && "border-t",
            position === Position.LEFT && "border-r",
            position === Position.RIGHT && "border-l"
          )} style={style}>
            {/* Header */}
            {modalOptions.title && (
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold">{modalOptions.title}</h2>
                <Button size="icon" variant="ghost" onClick={hide}>
                  <X size={20} />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {Component ? <Component {...modalOptions.contentProps} /> : null}
            </div>

            {/* Footer / Actions */}
            {Actions && (
              <div className="p-4 border-t">
                <Actions {...modalOptions.contentProps} />
              </div>
            )}
          </div>
        </>
      )}
    </ModalContext.Provider>
  );
}
