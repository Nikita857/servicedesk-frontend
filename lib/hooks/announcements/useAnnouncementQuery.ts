import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { announcementsApi } from "@/lib/api/announcements";

export function useAnnouncementQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: () => announcementsApi.getById(id),
    enabled: !!id,
  });
}
