import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ReactQueryProvider } from "@/components/react-query-provider"
import { DialogProvider } from "@/components/providers" // Import DialogProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Folder Image Gallery",
  description: "Upload and manage image folders with Dropbox integration",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <DialogProvider>

              {children}
            </DialogProvider>
            <Toaster />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
