import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";

interface TicketCounts {
  pendingCount: number;
  assignedToMeCount: number;
  unprocessedCount: number;
}

interface UseTicketsCountsQueryReturn extends TicketCounts {
  isLoading: boolean;
  refetch: () => void;
}

export function useTicketsCountsQuery(): UseTicketsCountsQueryReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const username = user?.username;
  const queryClient = useQueryClient();

  const countsQuery = useQuery({
    queryKey: queryKeys.tickets.counts(),
    queryFn: async (): Promise<TicketCounts> => {
      if (!isSpecialist) {
        return { pendingCount: 0, assignedToMeCount: 0, unprocessedCount: 0 };
      }

      const [all, pending] = await Promise.all([
        ticketApi.listAllDB(0, 9999),
        assignmentApi.getPendingCount(),
      ]);

      const assigned = all.content.filter(
        (t) => t.assignedToUsername && t.assignedToUsername === username
      ).length;

      const unprocessed = all.content.filter(
        (t) =>
          (!t.assignedToUsername || t.assignedToUsername.trim() === "") &&
          t.status === "NEW"
      ).length;

      return {
        pendingCount: pending,
        assignedToMeCount: assigned,
        unprocessedCount: unprocessed,
      };
    },
    enabled: isSpecialist,
    staleTime: 60 * 1000, // 1 минута
  });

  const refetch = useCallback(() => {
    countsQuery.refetch();
  }, [countsQuery]);

  return {
    pendingCount: countsQuery.data?.pendingCount ?? 0,
    assignedToMeCount: countsQuery.data?.assignedToMeCount ?? 0,
    unprocessedCount: countsQuery.data?.unprocessedCount ?? 0,
    isLoading: countsQuery.isLoading,
    refetch,
  };
}
