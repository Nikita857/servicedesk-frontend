import { useQuery } from "@tanstack/react-query";
import { statsApi, type UserTicketStats, type LineTicketStats } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook для получения своей статистики тикетов
 * Доступно всем пользователям
 */
export function useMyStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats.my(),
    queryFn: () => statsApi.getMyStats(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook для получения статистики по всем доступным линиям
 * Специалисты видят только свои линии, ADMIN — все
 */
export function useLineStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats.byAllLines(),
    queryFn: () => statsApi.getStatsByAllLines(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook для получения статистики конкретной линии
 */
export function useSingleLineStatsQuery(lineId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats.byLine(lineId),
    queryFn: () => statsApi.getStatsByLine(lineId),
    staleTime: 60 * 1000,
    enabled: enabled && lineId > 0,
  });
}

/**
 * Hook для получения глобальной статистики
 * Только для ADMIN
 */
export function useGlobalStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats.global(),
    queryFn: () => statsApi.getGlobalStats(),
    staleTime: 60 * 1000,
    enabled,
  });
}

// Re-export types
export type { UserTicketStats, LineTicketStats };
