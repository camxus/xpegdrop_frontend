"use client"

import { createContext, useState, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DialogOptions {
  title?: string
  description?: string
  content?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  variant?: "default" | "destructive"
}

interface DialogContextType {
  show: (options: DialogOptions) => void
  hide: () => void
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogOptions, setDialogOptions] = useState<DialogOptions>({})

  const show = (options: DialogOptions) => {
    setDialogOptions(options)
    setIsOpen(true)
  }

  const hide = () => {
    setIsOpen(false)
    setDialogOptions({})
  }

  const handleConfirm = () => {
    dialogOptions.onConfirm?.()
    hide()
  }

  const handleCancel = () => {
    dialogOptions.onCancel?.()
    hide()
  }

  return (
    <DialogContext.Provider value={{ show, hide }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          {dialogOptions.title && (
            <DialogHeader>
              <DialogTitle>{dialogOptions.title}</DialogTitle>
              {dialogOptions.description && <DialogDescription>{dialogOptions.description}</DialogDescription>}
            </DialogHeader>
          )}

          {dialogOptions.content && <div className="py-4">{dialogOptions.content}</div>}

          <DialogFooter>
            {dialogOptions.showCancel !== false && (
              <Button variant="outline" onClick={handleCancel}>
                {dialogOptions.cancelText || "Cancel"}
              </Button>
            )}
            <Button
              variant={dialogOptions.variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {dialogOptions.confirmText || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  )
}
