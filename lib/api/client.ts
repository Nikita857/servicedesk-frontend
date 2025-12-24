import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
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
function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

// Check if token is expired or will expire soon (within 60 seconds)
function isTokenExpiringSoon(token: string, thresholdMs = 60 * 1000): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // If can't decode, assume expired
  return Date.now() + thresholdMs >= expiration;
}

// Refresh the token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    // Use separate axios instance with its own timeout for refresh
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    }, {
      timeout: 15000, // 15 second timeout for refresh
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return accessToken;
  } catch (error) {
    // Only clear tokens on auth errors, not on network/timeout errors
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return null;
  }
}

// ==================== Interceptors ====================

// Request interceptor - add auth token and preventively refresh if needed
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window === 'undefined') return config;

    let token = localStorage.getItem('accessToken');

    // Skip token check for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/');
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
          const hasTokens = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
          if (!hasTokens && typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          // If we still have tokens, let the request proceed and fail naturally
          // This allows retry on network issues
        }
      } catch (error) {
        isRefreshing = false;
        // Don't redirect on network errors - let the request fail and show error
        console.error('[Auth] Token refresh failed:', error);
      }
    }

    // Add token to request
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 as fallback
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 - fallback if preventive refresh missed
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
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

      // Refresh failed - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
