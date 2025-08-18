/**
 * Token management utilities for authentication using cookies
 */

import {
  setCookieClient,
  getCookieClient,
  removeCookieClient,
  // getCookieServer,
  COOKIE_MAX_AGE,
} from "../cookie";

export const TOKEN_KEY = "auth_token";

/**
 * Set authentication token in cookies (client-side)
 */
export const setToken = (token: string): void => {
  setCookieClient(TOKEN_KEY, token, COOKIE_MAX_AGE);
};

/**
 * Get authentication token from cookies (client-side)
 */
export const getToken = (): Promise<string | null> => {
  return getCookieClient(TOKEN_KEY);
};

/**
 * Remove authentication token from cookies (client-side)
 */
export const removeToken = (): void => {
  removeCookieClient(TOKEN_KEY);
};

/**
 * Check if token exists (client-side)
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

/**
 * Parse JWT token to get payload
 */
export const parseToken = (token: string): any => {
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
    console.error("Error parsing token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

/**
 * Initialize authentication logic (e.g. token refresh or cleanup)
 */
export const initializeAuth = async (): Promise<void> => {
  const token = await getToken();

  if (token && isTokenExpired(token)) {
    removeToken();
  }
};

// /**
//  * Get token from server (e.g. in middleware or server components)
//  */
// export const getTokenServer = async(): Promise<string | undefined> => {
//   return await getCookieServer(TOKEN_KEY);
// };
