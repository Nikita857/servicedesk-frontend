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
    if (!isAuthenticated || !isHydrated) return;

    // Немедленная проверка при монтировании — покрывает кейс с просроченным токеном после перезагрузки
    checkAndRefreshToken().catch((e) => console.error("[AuthRefresh] Initial check failed:", e));

    // Периодическая проверка каждые 30 секунд — рефреш срабатывает только когда до истечения <= 30 секунд
    const intervalId = setInterval(async () => {
      try {
        await checkAndRefreshToken();
      } catch (error) {
        console.error("[AuthRefresh] Background refresh failed:", error);
      }
    }, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isHydrated]);

  return null;
}
