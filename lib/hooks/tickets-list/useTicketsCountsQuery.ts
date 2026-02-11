import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { assignmentApi } from "@/lib/api/assignments";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";

interface TicketCounts {
  pendingCount: number;
  newCount: number;
  openCount: number;
  closedCount: number;
  rejectedCount: number;
  total: number;
}

interface UseTicketsCountsQueryReturn extends TicketCounts {
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching ticket counts
 * Aggregates counts from LineTicketStats (by-line endpoint) + pending assignments
 */
export function useTicketsCountsQuery(): UseTicketsCountsQueryReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const countsQuery = useQuery({
    queryKey: queryKeys.tickets.counts(),
    queryFn: async (): Promise<TicketCounts> => {
      const [pendingCount, lineStatsResponse] = await Promise.all([
        assignmentApi.getPendingCount().catch(() => 0),
        statsApi.getStatsByAllLines().catch(() => null),
      ]);

      const lineStats = lineStatsResponse?.content ?? [];

      const newCount = lineStats.reduce((acc, line) => acc + line.newTickets, 0);
      const openCount = lineStats.reduce((acc, line) => acc + line.open, 0);
      const closedCount = lineStats.reduce((acc, line) => acc + line.closed, 0);
      const rejectedCount = lineStats.reduce((acc, line) => acc + line.rejected, 0);
      const total = lineStats.reduce((acc, line) => acc + line.total, 0);

      return {
        pendingCount,
        newCount,
        openCount,
        closedCount,
        rejectedCount,
        total,
      };
    },
    enabled: isSpecialist,
    staleTime: 0,
  });

  const refetch = useCallback(() => {
    countsQuery.refetch();
  }, [countsQuery]);

  return {
    pendingCount: countsQuery.data?.pendingCount ?? 0,
    newCount: countsQuery.data?.newCount ?? 0,
    openCount: countsQuery.data?.openCount ?? 0,
    closedCount: countsQuery.data?.closedCount ?? 0,
    rejectedCount: countsQuery.data?.rejectedCount ?? 0,
    total: countsQuery.data?.total ?? 0,
    isLoading: countsQuery.isLoading,
    refetch,
  };
}
