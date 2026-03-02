import { useEffect } from "react";
import { userApi } from "@/lib/api/users";
import { useAuthStore } from "@/stores";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useHeartbeat() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await userApi.heartbeat();
      } catch {
        // Ошибки игнорируем — cleanup task сам переведёт в OFFLINE при потере связи
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated]);
}
