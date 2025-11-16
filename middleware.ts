import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_KEY } from "./lib/api/token";

// Define public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup"];
const authorizedRoutes = ["/new", "/upgrade", "/billing", "/success"];

function isPublicPath(pathname: string): boolean {
  // Dynamic username route match — adjust if you have stricter rules
  const isUsernameRoute = /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9._~!$&'()*+,;=:@%\-]+)?$/.test(pathname);

  return isUsernameRoute && !authorizedRoutes.includes(pathname) || publicRoutes.includes(pathname);
}

// Helper function to decode JWT token
export function parseJwtToken(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Helper function to check if token is expired
export function isTokenExpired(payload: any): boolean {
  if (!payload || !payload.exp) return true;
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

// Extract subdomain if present
function getSubdomain(host: string): string | null {
  const parts = host.split(".");
  if (parts.length > 2) return parts[0]; // e.g., tenant.example.com → "tenant"
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = isPublicPath(pathname);

  let token =
    JSON.parse(request.cookies.get(TOKEN_KEY)?.value || "{}")?.idToken ||
    request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("x-auth-token")!;

  let payload = parseJwtToken(token);

  const requestHeaders = new Headers(request.headers);

  // Redirect unauthenticated users trying to access protected routes
  if (!isPublicRoute && (!token || !payload || isTokenExpired(payload))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAuthRoute = ["/login", "/signup", "/"].includes(pathname);
  const isAuthenticated = token && payload && !isTokenExpired(payload);

  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/new"; // keep qs intact
    return NextResponse.redirect(url);
  }

  // detect tenant from subdomain and inject it into headers
  const host = request.headers.get("host") || "";
  const tenant = getSubdomain(host);
  if (tenant) {
    requestHeaders.set("x-tenant", tenant);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
