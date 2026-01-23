import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds - increased to handle slow connections
});

// ==================== Token Refresh Logic ====================

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
function subscribeToTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers with new token
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// Decode JWT to get expiration time (without library)
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return null;

    // Check if timestamp is in milliseconds (usually > 10^12)
    // or in seconds (usually around 1.7*10^9)
    const exp = decoded.exp;
    return exp > 1000000000000 ? exp : exp * 1000;
  } catch {
    return null;
  }
}

// Check if token is expired or will expire soon (within 60 seconds)
export function isTokenExpiringSoon(
  token: string,
  thresholdMs = 60 * 1000,
): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // If can't decode, assume expired
  return Date.now() + thresholdMs >= expiration;
}

// Refresh the token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    // Use separate axios instance with its own timeout for refresh
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {
        refreshToken,
      },
      {
        timeout: 15000, // 15 second timeout for refresh
      },
    );

    const {
      accessToken,
      refreshToken: newRefreshToken,
      userAuthResponse,
    } = response.data.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    // Sync with Zustand store
    try {
      useAuthStore
        .getState()
        .setAuth(userAuthResponse, accessToken, newRefreshToken);
    } catch (e) {
      console.error("[Auth] Failed to sync store after refresh:", e);
    }

    return accessToken;
  } catch (error) {
    // Only clear tokens on auth errors, not on network/timeout errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      try {
        useAuthStore.getState().clearAuth();
      } catch (e) {
        // ignore
      }
    }
    return null;
  }
}

/**
 * Checks if the current token is about to expire and refreshes it if necessary.
 * Useful for background periodic checks.
 */
export async function checkAndRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  if (isTokenExpiringSoon(token)) {
    if (isRefreshing) {
      return new Promise((resolve) => subscribeToTokenRefresh(resolve));
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      if (newToken) {
        onTokenRefreshed(newToken);
        return newToken;
      }
    } catch (error) {
      isRefreshing = false;
      console.error("[Auth] Background check refresh failed:", error);
    }
  }
  return token;
}

// ==================== Interceptors ====================

// Request interceptor - add auth token and preventively refresh if needed
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window === "undefined") return config;

    let token = localStorage.getItem("accessToken");

    // Skip token check for auth endpoints
    const isAuthEndpoint = config.url?.includes("/auth/");
    if (isAuthEndpoint) {
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    // Check if token exists and is expiring soon
    if (token && isTokenExpiringSoon(token)) {
      // If already refreshing, wait for it
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeToTokenRefresh((newToken) => {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(config);
          });
        });
      }

      // Start refreshing
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          token = newToken;
        } else {
          // Refresh returned null - could be network error or auth error
          // Only redirect to login if we have no valid tokens at all
          const hasTokens =
            localStorage.getItem("accessToken") ||
            localStorage.getItem("refreshToken");
          if (!hasTokens && typeof window !== "undefined") {
            window.location.href = "/login";
          }
          // If we still have tokens, let the request proceed and fail naturally
          // This allows retry on network issues
        }
      } catch (error) {
        isRefreshing = false;
        // Don't redirect on network errors - let the request fail and show error
        console.error("[Auth] Token refresh failed:", error);
      }
    }

    // Add token to request
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 as fallback
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no response from server (network error), just reject
    if (!error.response) {
      return Promise.reject(error);
    }

    const data = error.response.data as any;
    const errorCode = data?.errorCode;
    const status = error.response.status;

    // Skip handling for auth endpoints to prevent loops
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    // Handle 401 Unauthorized
    if (status === 401 && !isAuthEndpoint) {
      // If token is expired, try to refresh
      if (errorCode === "TOKEN_EXPIRED" && !originalRequest?._retry) {
        originalRequest._retry = true;

        // If already refreshing, wait for it
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeToTokenRefresh((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(api(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;

          if (newToken) {
            onTokenRefreshed(newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          isRefreshing = false;
        }
      }

      // If refresh failed OR error is something else (TOKEN_INVALID, USER_DISABLED, etc.)
      // Clear auth and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        try {
          useAuthStore.getState().clearAuth();
        } catch (e) {
          // ignore
        }

        // Don't redirect if we're already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
