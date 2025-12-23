import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { authApi } from '@/lib/api/auth';
import { parseJwt } from '@/lib/utils/jwt';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Internal timer reference
  refreshTimeoutId: NodeJS.Timeout | null;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
  refreshAccessToken: () => Promise<void>;
  scheduleTokenRefresh: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      refreshTimeoutId: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Also store in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });

        // Schedule next refresh
        get().scheduleTokenRefresh(accessToken);
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        
        const { refreshTimeoutId } = get();
        if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          refreshTimeoutId: null,
        });
      },

      setHydrated: () => {
        set({ isHydrated: true });
        // Try to reschedule refresh if we have a token after rehydration
        const { accessToken } = get();
        if (accessToken) {
            get().scheduleTokenRefresh(accessToken);
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
          const response = await authApi.refresh(refreshToken);
          const { userAuthResponse, accessToken, refreshToken: newRefreshToken } = response;
          
          // Use the action to update state and reschedule
          get().setAuth(userAuthResponse, accessToken, newRefreshToken);
        } catch (error) {
          console.error("Failed to refresh token:", error);
          // Only clear auth if refresh specifically fails (e.g. refresh token expired)
          // But maybe better to let the interceptor handle the final 401?
          // For now, let's play safe and clear if we can't refresh.
          get().clearAuth();
        }
      },

      scheduleTokenRefresh: (token: string) => {
        // Clear existing timeout
        const { refreshTimeoutId } = get();
        if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

        const decoded = parseJwt(token);
        if (!decoded || !decoded.exp) return;

        const expiresAt = decoded.exp * 1000; // convert to ms
        const now = Date.now();
        const timeUntilExpire = expiresAt - now;
        
        // Refresh 5 minutes before expiration
        const REFRESH_THRESHOLD = 5 * 60 * 1000; 
        
        // If token expires in less than 5 mins, refresh immediately (next tick)
        // Otherwise wait until 5 mins before
        let delay = timeUntilExpire - REFRESH_THRESHOLD;
        
        if (delay < 0) {
            delay = 0; 
        }

        // Safety: max delay for setTimeout is 32-bit int (~24 days). 
        // JWTs usually shorter, but good to know.
        if (delay > 2147483647) delay = 2147483647;

        const newTimeoutId = setTimeout(() => {
          get().refreshAccessToken();
        }, delay);

        set({ refreshTimeoutId: newTimeoutId });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
