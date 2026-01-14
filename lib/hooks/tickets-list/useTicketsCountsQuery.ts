import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { reportsApi } from "@/lib/api/reports";
import { assignmentApi } from "@/lib/api/assignments";
import { ticketApi } from "@/lib/api/tickets";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";

interface TicketCounts {
  pendingCount: number;
  assignedToMeCount: number;
  closedCount: number;
  unprocessedCount: number;
  openCount: number;
  resolvedCount: number;
}

interface UseTicketsCountsQueryReturn extends TicketCounts {
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching ticket counts using efficient Reports API
 * Uses /reports/tickets/by-status instead of loading all tickets
 */
export function useTicketsCountsQuery(): UseTicketsCountsQueryReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const isAdmin = user?.roles.includes("ADMIN") || false;

  const countsQuery = useQuery({
    queryKey: queryKeys.tickets.counts(),
    queryFn: async (): Promise<TicketCounts> => {
      if (!isSpecialist) {
        return {
          pendingCount: 0,
          assignedToMeCount: 0,
          closedCount: 0,
          unprocessedCount: 0,
          openCount: 0,
          resolvedCount: 0,
        };
      }

      // Fetch all data in parallel with error handling
      const [statusStats, pendingCount, assignedTickets, lineStats] =
        await Promise.all([
          isAdmin
            ? reportsApi.getStatsByStatus().catch(() => [])
            : Promise.resolve([]),
          assignmentApi.getPendingCount().catch(() => 0),
          ticketApi
            .listAssigned(0, 100)
            .catch(() => ({ content: [], totalElements: 0, totalPages: 0 })),
          statsApi.getStatsByAllLines().catch(() => []),
        ]);

      // Extract counts from status stats (for ADMIN)
      const getCount = (status: string) =>
        statusStats.find((s) => s.status === status)?.count ?? 0;

      // For specialists, if statusStats is empty, aggregate from lineStats
      let newCount = getCount("NEW");
      let openCount =
        getCount("OPEN") + getCount("PENDING") + getCount("ESCALATED");
      let resolvedCount = getCount("RESOLVED");

      if (statusStats.length === 0 && lineStats.length > 0) {
        newCount = lineStats.reduce((acc, line) => acc + line.newTickets, 0);
        openCount = lineStats.reduce((acc, line) => acc + line.open, 0);
        resolvedCount = lineStats.reduce((acc, line) => acc + line.resolved, 0);
      }

      // Count assigned tickets (not closed) and closed separately
      const assignedNotClosed = assignedTickets.content.filter(
        (t) => t.status !== "CLOSED" && t.status !== "CANCELLED"
      ).length;

      const closedByMe = assignedTickets.content.filter(
        (t) => t.status === "CLOSED"
      ).length;

      return {
        pendingCount,
        assignedToMeCount: assignedNotClosed,
        closedCount: closedByMe,
        unprocessedCount: newCount,
        openCount,
        resolvedCount,
      };
    },
    enabled: isSpecialist,
    staleTime: 0, // Fresh counts every time
  });

  const refetch = useCallback(() => {
    countsQuery.refetch();
  }, [countsQuery]);

  return {
    pendingCount: countsQuery.data?.pendingCount ?? 0,
    assignedToMeCount: countsQuery.data?.assignedToMeCount ?? 0,
    closedCount: countsQuery.data?.closedCount ?? 0,
    unprocessedCount: countsQuery.data?.unprocessedCount ?? 0,
    openCount: countsQuery.data?.openCount ?? 0,
    resolvedCount: countsQuery.data?.resolvedCount ?? 0,
    isLoading: countsQuery.isLoading,
    refetch,
  };
}
