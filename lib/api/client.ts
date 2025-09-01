/**
 * API client using Axios for making requests to the backend
 */
import axios, {
  AxiosProgressEvent,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { authApi } from "./authApi";
import { getCookieClient, setCookieClient } from "../cookie";
import { TOKEN_KEY } from "./token";
import { cookies } from "next/headers";
import { parseJwtToken } from "@/middleware";

// Base API URL - can be overridden with environment variable
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

// Error class for API errors
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Request options type
type RequestOptions = Omit<AxiosRequestConfig, "url" | "method" | "data"> & {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
};

// Update the apiRequest function to handle onUploadProgress
export async function apiRequest<T = any>(
  endpoint: string,
  method = "GET",
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  try {
    // Extract onUploadProgress from options
    const { onUploadProgress, ...axiosOptions } = options;

    // Prepare URL
    const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Configure upload progress handler if provided
    const requestConfig: AxiosRequestConfig = {
      url,
      method,
      data,
      ...axiosOptions,
    };

    // Add upload progress handler if provided
    if (onUploadProgress) {
      requestConfig.onUploadProgress = (progressEvent) => {
        const total = progressEvent.total || 0;
        const progress = total ? progressEvent.loaded / total : 0;
        const bytes = total ? progressEvent.bytes : 0;

        onUploadProgress({
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          progress,
          bytes,
          lengthComputable: false,
        });
      };
    }

    // Make the request
    const response: AxiosResponse<T> = await axiosInstance(requestConfig);

    return response.data;
  } catch (error) {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Handle timeout
      if (axiosError.code === "ECONNABORTED") {
        throw new ApiError("Request timeout", 408);
      }

      // Handle API errors with response
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;
        const message =
          typeof data === "object" && data !== null
            ? "message" in data && typeof data.message === "string"
              ? data.message
              : "error" in data && typeof (data as any).error === "string"
                ? (data as any).error
                : `API request failed with status ${status}`
            : `API request failed with status ${status}`;

        throw new ApiError(message, status, data);
      }

      // Handle network errors
      if (axiosError.request) {
        throw new ApiError("Network error - no response received", 0);
      }
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
}

axiosInstance.interceptors.request.use(
  async (config) => {
    // Only add tokens if withCredentials is true
    if (config.withCredentials) {
      const token = await getCookieClient(TOKEN_KEY);
      if (token) {
        const { accessToken, idToken } = JSON.parse(token);

        config.headers = config.headers ?? {};

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // if (idToken) {
        //   config.headers["x-id-token"] = idToken;
        // }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global error responses here if needed
    // For example, redirect to login page on 401 errors
    // if (error.response && error.response.status === 401) {
    //   // Redirect to login or refresh token
    // }
    return Promise.reject(error);
  }
);

// Add this function somewhere in your api file

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  async (config) => {
    if (config.withCredentials) {
      const token = await getCookieClient(TOKEN_KEY);

      if (token) {
        const { accessToken, idToken, refreshToken } = JSON.parse(token);

        let isExpired = false;

        try {
          const decoded: any = parseJwtToken(accessToken.replace("Bearer ", ""))
          if (decoded?.exp) {
            const now = Math.floor(Date.now() / 1000);
            isExpired = decoded.exp <= now;
          }
        } catch (err) {
          isExpired = true; // if decoding fails, force refresh
        }

        if (isExpired && refreshToken && !isRefreshing) {
          try {
            isRefreshing = true;
            const { accessToken, idToken } = await authApi.refreshToken({ refreshToken });
            setCookieClient(TOKEN_KEY, JSON.stringify({ accessToken, idToken, refreshToken }))
            processQueue(null);
          } catch (refreshError) {
            processQueue(refreshError, null);
            throw refreshError;
          } finally {
            isRefreshing = false;
          }
        }

        // set headers after refresh attempt
        config.headers = config.headers ?? {};

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // if (idToken) {
        //   config.headers["x-id-token"] = idToken;
        // }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// Convenience methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, "GET", undefined, options),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, "POST", data, options),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, "PUT", data, options),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, "PATCH", data, options),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, "DELETE", undefined, options),
};

export default axiosInstance;
