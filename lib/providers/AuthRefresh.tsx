"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { checkAndRefreshToken } from "@/lib/api/client";

/**
 * Background component that ensures the auth token is refreshed before it expires,
 * even if no active requests are being made.
 */
export function AuthRefresh() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    // Only start timer if authenticated and store is hydrated
    if (!isAuthenticated || !isHydrated) return;

    // Check every 45 seconds
    const intervalId = setInterval(async () => {
      try {
        await checkAndRefreshToken();
      } catch (error) {
        console.error("[AuthRefresh] Background refresh failed:", error);
      }
    }, 45000);

    // Also check immediately on mount/auth change
    checkAndRefreshToken();

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isHydrated]);

  return null;
}
