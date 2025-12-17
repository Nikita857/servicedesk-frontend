import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { toaster } from "@/components/ui/toaster";
import type { Ticket } from "@/types/ticket";

interface UseTicketQueryReturn {
  ticket: Ticket | null;
  isLoading: boolean;
  isError: boolean;
  currentAssignment: Assignment | null;
  assignmentHistory: Assignment[];
  updateTicket: (ticket: Ticket) => void;
  refetch: () => void;
}

export function useTicketQuery(ticketId: number): UseTicketQueryReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Main ticket query
  const ticketQuery = useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: async () => {
      try {
        return await ticketApi.get(ticketId);
      } catch (error) {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось загрузить тикет",
          closable: true,
        });
        router.push("/dashboard/tickets");
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Current assignment query
  const currentAssignmentQuery = useQuery({
    queryKey: queryKeys.assignments.current(ticketId),
    queryFn: () => assignmentApi.getCurrentForTicket(ticketId),
    staleTime: 30 * 1000,
  });

  // Assignment history query
  const historyQuery = useQuery({
    queryKey: queryKeys.assignments.history(ticketId),
    queryFn: () => assignmentApi.getTicketHistory(ticketId),
    staleTime: 60 * 1000,
  });

  // Optimistic update for WebSocket updates
  const updateTicket = useCallback(
    (updatedTicket: Ticket) => {
      queryClient.setQueryData(
        queryKeys.tickets.detail(ticketId),
        updatedTicket
      );
    },
    [queryClient, ticketId]
  );

  const refetch = useCallback(() => {
    ticketQuery.refetch();
    currentAssignmentQuery.refetch();
    historyQuery.refetch();
  }, [ticketQuery, currentAssignmentQuery, historyQuery]);

  return {
    ticket: ticketQuery.data ?? null,
    isLoading: ticketQuery.isLoading,
    isError: ticketQuery.isError,
    currentAssignment: currentAssignmentQuery.data ?? null,
    assignmentHistory: historyQuery.data ?? [],
    updateTicket,
    refetch,
  };
}
