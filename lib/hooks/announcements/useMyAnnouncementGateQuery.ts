import { announcementsApi } from "@/lib/api/announcements";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useMyAnnouncementsGateQuery() {
  return useQuery({
    queryKey: queryKeys.announcements.gate(),
    queryFn: () => announcementsApi.getMyGate(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
