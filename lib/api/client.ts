import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "@/stores/authStore";
import {toast} from "@/lib/utils";

interface AuthError {
  success: boolean;
  errorCode: "TOKEN_EXPIRED" | "TOKEN_INVALID" | "USER_NOT_FOUND" | "AUTH_FAILED";
  message: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds - increased to handle slow connections
});

// ==================== Token Refresh Logic ====================

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

function subscribeToTokenRefresh(callback: () => void) {
  refreshSubscribers.push(callback);
}


function onTokenRefreshed() {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
}

function getCookie(name: string): string | null {
  if(typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  return null;
}

// Подставлем в во все запросы кроме ('GET', 'HEAD', 'OPTIONS', 'TRACE') X-XSRF-TOKEN
api.interceptors.request.use( async (config) => {
  const method = config.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    let csrfToken = getCookie('XSRF-TOKEN');
    // Фикс проблемы исчезающего CSRF токена
    // Если не задать куки lifetime то браузер считает ее сесионной, и в случайный момент
    // сбрасывает ее, из за этого в случайный момент запрос на бэк будет отклонен CSRF фильтром в Spring Security
    //Перехватчик видит куки посколько она HttpOnly: false, еси ее нет - сначала делаем запрос на легковесный эндпоинт
    // получаем куку и уже с ней обращаемся на нужный эндпоинт
    if(!csrfToken) {
      await axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true });
      csrfToken = getCookie('XSRF-TOKEN');
    }
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// Refresh the token
export async function refreshAccessToken(): Promise<boolean> {
  try {
    // Use separate axios instance with its own timeout for refresh
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15000 },
    );

    const { userAuthResponse, expiresIn } = response.data.data;

    try {
      useAuthStore.getState().setAuth(userAuthResponse, expiresIn)
    } catch (e) {
      console.error("[Auth] failed to sync store after refresh ", e);
    }
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        useAuthStore.getState().clearAuth();
        toast.warning("Ваша сессия истекла, войдите снова.")
      } catch (e) { console.error(e); }
    }
    return false;
  }
}


/**
 * Checks if the current token is about to expire and refreshes it if necessary.
 * Useful for background periodic checks.
 */
export async function checkAndRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!useAuthStore.getState().isAuthenticated) return false;

  const expiresIn  = useAuthStore.getState().expiresIn;
  if(expiresIn) {
    if (isRefreshing) {
      return new Promise((resolve) => subscribeToTokenRefresh(() => resolve(true)));
    }

    isRefreshing = true;
    try {
      const success = await refreshAccessToken();
      isRefreshing = false;
      if (success) onTokenRefreshed();
      return success;
    } catch (error) {
      isRefreshing = false;
      console.error("[Auth] Background check refresh failed:", error);
      return false;
    }
  }
  return isRefreshing;
}


// ==================== Interceptors ====================

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (!error.response) return Promise.reject(error);

      const data = error.response.data as AuthError;
      const errorCode = data?.errorCode;
      const status = error.response.status;
      const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

      if (status === 401 && !isAuthEndpoint) {
        if (errorCode === "TOKEN_EXPIRED" && !originalRequest?._retry) {
          originalRequest._retry = true;

          if (isRefreshing) {
            return new Promise((resolve) => {
              subscribeToTokenRefresh(() => resolve(api(originalRequest)));
            });
          }

          isRefreshing = true;
          try {
            const success = await refreshAccessToken();
            isRefreshing = false;
            if (success) {
              onTokenRefreshed();
              return api(originalRequest);  // retry — cookie обновлена
            }
          } catch (refreshError) {
            isRefreshing = false;
          }
        }

        // Refresh не помог или другая ошибка
        if (typeof window !== "undefined") {
          try { useAuthStore.getState().clearAuth(); } catch (e) { /* ignore */ }
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }

      return Promise.reject(error);
    }
);

export default api;
