
// lib/cookie.ts

import { cookies, cookies as serverCookies } from "next/headers"

export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// ---------------------------
// Client-side functions
// ---------------------------

export async function setCookieClient(key: string, value: string, maxAge = COOKIE_MAX_AGE) {
  if (typeof document !== "undefined") {
    const secure = location.protocol === "https:" ? "Secure;" : ""
    document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; ${secure}`
  }
}

export async function getCookieClient(key: string): Promise<string | null> {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split("; ")
  const cookie = cookies.find((c) => c.startsWith(`${key}=`))
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null
}

export async function removeCookieClient(key: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax;`
  }
}
// // ---------------------------
// // Server-side functions (Next.js App Router)
// // ---------------------------

// export function getCookieServer(key: string): string | undefined {
//   const cookies = serverCookies()
//   return cookies.get(key)?.value
// }