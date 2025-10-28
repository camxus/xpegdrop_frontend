import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "fframess",
  description: "Your data is yours",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SiteHeader>{children}</SiteHeader>
        </Providers>
      </body>
    </html>
  );
}
