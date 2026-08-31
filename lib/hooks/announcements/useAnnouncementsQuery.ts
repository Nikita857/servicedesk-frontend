import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";

export function useAnnouncementsQuery(page: number = 0, size: number = 5) {
  return useQuery({
    queryKey: queryKeys.announcements.list(page, size),
    queryFn: () => announcementsApi.list(page, size),
  });
}
