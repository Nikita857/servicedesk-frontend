import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  expiresIn: number | null;
  tokenExpiresAt: number | null; // абсолютный timestamp когда истекает токен (ms)
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, expiresIn: number) => void;
  clearAuth: () => void;
  setHydrated: () => void;
  updateUserAvatar: (avatarUrl: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      expiresIn: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, expiresIn) => {
        set({
          user,
          expiresIn,
          tokenExpiresAt: Date.now() + expiresIn,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          expiresIn: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
        });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },

      updateUserAvatar: (avatarUrl: string | null) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, avatarUrl } });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
