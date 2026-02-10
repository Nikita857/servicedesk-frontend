import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import type { TicketStatus, PagedTicketList, Ticket } from "@/types/ticket";

export interface StatusTicketsVM {
  data: PagedTicketList | null;
  meta: {
    isLoading: boolean;
    isFetching: boolean;
  };
  actions: {
    setPage: (page: number) => void;
    refetch: () => void;
  };
}

export interface SpecialistTicketsVM {
  NEW: StatusTicketsVM;
  OPEN: StatusTicketsVM;
  PENDING: StatusTicketsVM;
  CLOSED: StatusTicketsVM;
  refetchAll: () => void;
}

export function useSpecialistTicketsByStatus(
  pageSize: number = 5,
): SpecialistTicketsVM {
  const queryClient = useQueryClient();
  const { subscribeToNewTickets, isConnected } = useWebSocket();

  type SpecialistTicketStatus = "NEW" | "OPEN" | "PENDING" | "CLOSED" ;
  const [pages, setPages] = useState<Record<SpecialistTicketStatus, number>>({
    NEW: 0,
    OPEN: 0,
    PENDING: 0,
    CLOSED: 0,
  });

  const setPage = useCallback((status: TicketStatus, page: number) => {
    setPages((prev) => ({ ...prev, [status]: page }));
  }, []);

  // Invalidate cache for a specific status
  const invalidateByStatus = useCallback(
    (status: TicketStatus) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "tickets" &&
            key[1] === "by-status" &&
            key[2] === status
          );
        },
      });
    },
    [queryClient],
  );

  // Subscribe to new tickets via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToNewTickets((ticket: Ticket) => {
      console.log("[WS] Новый тикет получен:", ticket.id, ticket.status);
      invalidateByStatus(ticket.status as TicketStatus);
    });

    return () => unsubscribe();
  }, [isConnected, subscribeToNewTickets, invalidateByStatus]);

  // Helper to create query for a status
  const useStatusQuery = (status: SpecialistTicketStatus) => {
    const page = pages[status];
    const query = useQuery({
      queryKey: queryKeys.tickets.byStatus(status, page, pageSize),
      queryFn: () => ticketApi.listByStatus(status, page, pageSize),
      staleTime: 30 * 1000,
    });

    return {
      data: query.data ?? null,
      meta: { isLoading: query.isLoading, isFetching: query.isFetching },
      actions: {
        setPage: (p: number) => setPage(status, p),
        refetch: query.refetch,
      },
    };
  };

  const newTickets = useStatusQuery("NEW");
  const openTickets = useStatusQuery("OPEN");
  const pendingTickets = useStatusQuery("PENDING");
  const closedTickets = useStatusQuery("CLOSED");

  const refetchAll = useCallback(() => {
    newTickets.actions.refetch();
    openTickets.actions.refetch();
    pendingTickets.actions.refetch();
    closedTickets.actions.refetch();
  }, [newTickets, openTickets, pendingTickets, closedTickets]);

  return {
    NEW: newTickets,
    OPEN: openTickets,
    PENDING: pendingTickets,
    CLOSED: closedTickets,
    refetchAll,
  };
}
