import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import type { TicketStatus, PagedTicketList } from "@/types/ticket";

interface StatusTicketsVM {
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

interface SpecialistTicketsVM {
  NEW: StatusTicketsVM;
  OPEN: StatusTicketsVM;
  PENDING: StatusTicketsVM;
  ESCALATED: StatusTicketsVM;
  CLOSED: StatusTicketsVM;
  refetchAll: () => void;
}

export function useSpecialistTicketsByStatus(
  pageSize: number = 5,
): SpecialistTicketsVM {
  const queryClient = useQueryClient();
  const {
    subscribeToNewTickets,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    isConnected,
  } = useWebSocket();

  type SpecialistTicketStatus = "NEW" | "OPEN" | "PENDING" | "ESCALATED" | "CLOSED" | "REOPENED";
  const STORAGE_KEY = "sd_page_specialist-tickets";
  const defaultPages: Record<SpecialistTicketStatus, number> = { NEW: 0, OPEN: 0, PENDING: 0, ESCALATED: 0, CLOSED: 0, REOPENED: 0 };

  const [pages, setPages] = useState<Record<SpecialistTicketStatus, number>>(() => {
    if (typeof window === "undefined") return defaultPages;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultPages, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return defaultPages;
  });

  const setPage = useCallback((status: TicketStatus, page: number) => {
    setPages((prev) => {
      const next = { ...prev, [status]: page };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Subscribe to new tickets via WebSocket — broad invalidation so no event is missed
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToNewTickets(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    });

    return () => unsubscribe();
  }, [isConnected, subscribeToNewTickets, queryClient]);

  // Helper to create query for a status
  const useStatusQuery = (status: SpecialistTicketStatus) => {
    const page = pages[status];
    const query = useQuery({
      queryKey: queryKeys.tickets.byStatus(status, page, pageSize),
      queryFn: () => ticketApi.listByStatus(status, page, pageSize),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
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
  const reopenedTickets = useStatusQuery("REOPENED");
  const pendingTickets = useStatusQuery("PENDING");
  const escalatedTickets = useStatusQuery("ESCALATED");
  const closedTickets = useStatusQuery("CLOSED");

  // Собираем идентификаторы всех видимых тикетов по всем статусам и
  // подписываемся на их per-ticket обновления/удаления. Без этой подписки
  // колонки не пересортируются при смене статуса или назначения — бэкенд
  // шлёт такие события в /topic/ticket/{id}, а не в /topic/ticket/new.
  const visibleTicketIds = useMemo(() => {
    const ids = new Set<number>();
    const push = (list: PagedTicketList | null | undefined) => {
      if (!list) return;
      for (const t of list.content ?? []) ids.add(t.id);
    };
    push(newTickets.data);
    push(openTickets.data);
    push(reopenedTickets.data);
    push(pendingTickets.data);
    push(escalatedTickets.data);
    push(closedTickets.data);
    return Array.from(ids);
  }, [
    newTickets.data,
    openTickets.data,
    reopenedTickets.data,
    pendingTickets.data,
    escalatedTickets.data,
    closedTickets.data,
  ]);
  const visibleTicketIdsKey = visibleTicketIds.join(",");

  useEffect(() => {
    if (!isConnected || visibleTicketIds.length === 0) return;
    const unsubs: Array<() => void> = [];
    for (const id of visibleTicketIds) {
      unsubs.push(
        subscribeToTicketUpdates(id, (updated) => {
          queryClient.setQueryData(queryKeys.tickets.detail(id), updated);
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        }),
      );
      unsubs.push(
        subscribeToTicketDeleted(id, () => {
          queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        }),
      );
    }
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConnected,
    visibleTicketIdsKey,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    queryClient,
  ]);

  // Объединяем OPEN + REOPENED в одну плитку "В работе"
  const mergedOpenTickets: StatusTicketsVM = {
    data: openTickets.data && reopenedTickets.data
      ? {
          content: [...openTickets.data.content, ...reopenedTickets.data.content],
          page: {
            ...openTickets.data.page,
            totalElements: (openTickets.data.page?.totalElements ?? 0) + (reopenedTickets.data.page?.totalElements ?? 0),
          },
        }
      : openTickets.data ?? reopenedTickets.data,
    meta: {
      isLoading: openTickets.meta.isLoading || reopenedTickets.meta.isLoading,
      isFetching: openTickets.meta.isFetching || reopenedTickets.meta.isFetching,
    },
    actions: {
      setPage: openTickets.actions.setPage,
      refetch: () => { openTickets.actions.refetch(); reopenedTickets.actions.refetch(); },
    },
  };

  const refetchAll = useCallback(() => {
    newTickets.actions.refetch();
    openTickets.actions.refetch();
    reopenedTickets.actions.refetch();
    pendingTickets.actions.refetch();
    escalatedTickets.actions.refetch();
    closedTickets.actions.refetch();
  }, [newTickets, openTickets, reopenedTickets, pendingTickets, escalatedTickets, closedTickets]);

  // Refetch everything when WebSocket reconnects to recover missed events
  const prevConnectedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (isConnected && prevConnectedRef.current === false) {
      refetchAll();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, refetchAll]);

  return {
    NEW: newTickets,
    OPEN: mergedOpenTickets,
    PENDING: pendingTickets,
    ESCALATED: escalatedTickets,
    CLOSED: closedTickets,
    refetchAll,
  };
}
