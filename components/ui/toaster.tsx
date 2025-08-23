"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="max-h-[60vh]">
          <div className="grid gap-1 w-full">
            {title && <ToastTitle>{title}</ToastTitle>}
          </div>

          {description && (
            <div className="overflow-y-auto flex-1 max-h-[inherit] w-full mt-1 grid gap-1">
              <ToastDescription>{description}</ToastDescription>
            </div>
          )}

          {action && <div className="mt-1">{action}</div>}

          <ToastClose />
        </Toast>
      ))}

      <ToastViewport />
    </ToastProvider>
  );
}
