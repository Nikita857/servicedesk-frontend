import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";
import type { TicketListItem, PagedTicketList } from "@/types/ticket";

export type FilterType =
  | "unprocessed"
  | "my"
  | "assigned"
  | "pending"
  | "closed";

interface UseTicketsQueryOptions {
  initialFilter?: FilterType;
  pageSize?: number;
}

interface UseTicketsQueryReturn {
  tickets: TicketListItem[];
  pendingAssignments: Assignment[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  filter: FilterType;
  setPage: (page: number) => void;
  setFilter: (filter: FilterType) => void;
  refetch: () => void;
  // For WebSocket updates
  addTicket: (ticket: TicketListItem) => void;
  updateTicketInList: (ticket: TicketListItem) => void;
  removeTicket: (ticketId: number) => void;
}

export function useTicketsQuery(
  options: UseTicketsQueryOptions = {}
): UseTicketsQueryReturn {
  const { pageSize = 5 } = options;
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rawFilter, setRawFilter] = useState<FilterType>(
    options.initialFilter ?? (isSpecialist ? "unprocessed" : "my")
  );

  // Derived state: non-specialists are forced to "my" filter
  const filter = isSpecialist ? rawFilter : "my";

  // Use effective filter for queries
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.list({ filter, page }),
    queryFn: async (): Promise<PagedTicketList> => {
      switch (filter) {
        case "my":
          return ticketApi.listMy(page, pageSize);
        case "assigned": {
          // Get assigned tickets, exclude CLOSED and CANCELLED
          const response = await ticketApi.listAssigned(page, pageSize);
          return {
            ...response,
            content: response.content.filter(
              (t) => t.status !== "CLOSED" && t.status !== "CANCELLED"
            ),
          };
        }
        case "closed": {
          // Get tickets that are CLOSED using dedicated status endpoint
          return ticketApi.listByStatus("CLOSED", page, pageSize);
        }
        case "unprocessed": {
          // Get NEW tickets using dedicated status endpoint
          return ticketApi.listByStatus("NEW", page, pageSize);
        }
        default:
          return ticketApi.listMy(page, pageSize);
      }
    },
    enabled: filter !== "pending",
    staleTime: 0,
  });

  // Query for pending assignments
  const pendingQuery = useQuery({
    queryKey: queryKeys.assignments.pending(page),
    queryFn: () => assignmentApi.getMyPending(page, pageSize),
    enabled: filter === "pending",
    staleTime: 0,
  });

  // Optimistic update helpers
  const addTicket = useCallback(
    (ticket: TicketListItem) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: [ticket, ...old.content],
            totalElements: old.totalElements + 1,
          };
        }
      );
    },
    [queryClient, filter, page]
  );

  const updateTicketInList = useCallback(
    (updatedTicket: TicketListItem) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t
            ),
          };
        }
      );
    },
    [queryClient, filter, page]
  );

  const removeTicket = useCallback(
    (ticketId: number) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((t) => t.id !== ticketId),
            totalElements: old.totalElements - 1,
          };
        }
      );
    },
    [queryClient, filter, page]
  );

  const handleSetFilter = useCallback(
    (newFilter: FilterType) => {
      if (isSpecialist) {
        setRawFilter(newFilter);
        setPage(0);
      }
    },
    [isSpecialist]
  );

  const refetch = useCallback(() => {
    if (filter === "pending") {
      pendingQuery.refetch();
    } else {
      ticketsQuery.refetch();
    }
  }, [filter, ticketsQuery, pendingQuery]);

  // Determine which data to return based on filter
  if (filter === "pending") {
    return {
      tickets: [],
      pendingAssignments: pendingQuery.data?.content ?? [],
      isLoading: pendingQuery.isLoading,
      isFetching: pendingQuery.isFetching,
      isError: pendingQuery.isError,
      page,
      totalPages: pendingQuery.data?.totalPages ?? 0,
      filter,
      setPage,
      setFilter: handleSetFilter,
      refetch,
      addTicket,
      updateTicketInList,
      removeTicket,
    };
  }

  return {
    tickets: ticketsQuery.data?.content ?? [],
    pendingAssignments: [],
    isLoading: ticketsQuery.isLoading,
    isFetching: ticketsQuery.isFetching,
    isError: ticketsQuery.isError,
    page,
    totalPages: ticketsQuery.data?.totalPages ?? 0,
    filter,
    setPage,
    setFilter: handleSetFilter,
    refetch,
    addTicket,
    updateTicketInList,
    removeTicket,
  };
}
