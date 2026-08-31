import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";

/**
 * Источник истины для AnnouncementGate и страницы истории.
 * refetchInterval — fallback на случай пропуска WS-инвалидации (разрыв соединения),
 * укладывается в допустимую задержку доставки 1-2 мин.
 */

export function useMyAnnouncementsQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.announcements.my(page),
    queryFn: () => announcementsApi.getMy(page),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
