import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";

const BASE_TITLE = "ServiceDesk";

/**
 * Анимирует заголовок вкладки браузера для специалистов:
 * показывает количество новых, эскалированных и назначенных тикетов.
 */
export function useTabTitle(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);

  const { data: stats } = useQuery({
    queryKey: queryKeys.stats.my(),
    queryFn: () => statsApi.getMyStats(),
    enabled,
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    // Cleanup helper
    const clearAnim = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!enabled || !stats) {
      document.title = BASE_TITLE;
      clearAnim();
      return;
    }

    const byStatus = stats.byStatus ?? {};
    const newCount = byStatus["NEW"] ?? 0;
    const escalatedCount = byStatus["ESCALATED"] ?? 0;
    const assignedCount =
      (byStatus["OPEN"] ?? 0) +
      (byStatus["PENDING"] ?? 0) +
      (byStatus["REOPENED"] ?? 0);

    const total = newCount + escalatedCount + assignedCount;

    if (total === 0) {
      document.title = BASE_TITLE;
      clearAnim();
      return;
    }

    // Формируем строку уведомления
    const parts: string[] = [];
    if (newCount > 0) parts.push(`${newCount} новых`);
    if (escalatedCount > 0) parts.push(`${escalatedCount} эскал.`);
    if (assignedCount > 0) parts.push(`${assignedCount} в работе`);
    const alertTitle = `(${total}) ${parts.join(" · ")} — ${BASE_TITLE}`;

    // Кадры анимации: пульсирующий bullet + обычный заголовок
    const frames = [alertTitle, BASE_TITLE];

    clearAnim();
    frameRef.current = 0;
    document.title = alertTitle;

    intervalRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length;
      document.title = frames[frameRef.current];
    }, 1500);

    return clearAnim;
  }, [enabled, stats]);

  // Восстанавливаем заголовок при размонтировании
  useEffect(() => {
    return () => {
      document.title = BASE_TITLE;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
