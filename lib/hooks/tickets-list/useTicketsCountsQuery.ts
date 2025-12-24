import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { reportsApi } from "@/lib/api/reports";
import { assignmentApi } from "@/lib/api/assignments";
import { ticketApi } from "@/lib/api/tickets";
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

      // Fetch all data in parallel
      const [statusStats, pendingCount, assignedTickets] = await Promise.all([
        reportsApi.getTicketsByStatus(),
        assignmentApi.getPendingCount(),
        ticketApi.listAssigned(0, 100), // Get assigned tickets for accurate counts
      ]);

      // Extract counts from status stats
      const getCount = (status: string) =>
        statusStats.find((s) => s.status === status)?.count ?? 0;

      const newCount = getCount("NEW");
      const openCount = getCount("OPEN") + getCount("PENDING") + getCount("ESCALATED");
      const resolvedCount = getCount("RESOLVED");

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
    staleTime: 60 * 1000, // 1 minute
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

