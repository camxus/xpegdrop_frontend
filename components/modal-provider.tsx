"use client";

import { createContext, useState, type ReactNode, type FC, useEffect } from "react";
import { X } from "lucide-react";

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
  width?: string;   // for left/right
  height?: string;  // for top/bottom
  position?: Position;
  containerStyle?: React.CSSProperties;
}

interface ModalContextType {
  show: (options: ModalOptions) => void;
  hide: () => void;
  updateProps: (newProps: Record<string, unknown>) => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

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
    setModalOptions(prev => ({
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
  const width = modalOptions.width || "400px";
  const height = modalOptions.height || "300px";

  // Base style
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    background: "black",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s ease, opacity 0.3s ease",
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
            className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ zIndex: 40 }}
            onClick={hide}
          />

          {/* Modal Panel */}
          <div style={style}>
            {/* Header */}
            {modalOptions.title && (
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">{modalOptions.title}</h2>
                <button onClick={hide} className="p-1 rounded hover:bg-gray-100">
                  <X size={20} />
                </button>
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
