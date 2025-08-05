"use client"

import type React from "react"

import { useContext } from "react"
import { DialogContext } from "@/components/providers"

interface DialogState {
  isOpen: boolean
  content: React.ReactNode | null
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider")
  }
  return context
}
