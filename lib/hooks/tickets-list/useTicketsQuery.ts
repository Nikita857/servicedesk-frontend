import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";
import type { TicketListItem, PagedTicketList } from "@/types/ticket";

const FILTER_STORAGE_KEY = "servicedesk-tickets-filter";

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

export interface TicketsPageResult {
  data: PagedTicketList | null;
  pendingAssignments?: Assignment[];

  meta: {
    filter: FilterType;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  };

  actions: {
    setPage: (page: number) => void;
    setFilter: (filter: FilterType) => void;
    refetch: () => void;
  };

  optimistic: {
    addTicket: (ticket: TicketListItem) => void;
    updateTicket: (ticket: TicketListItem) => void;
    removeTicket: (ticketId: number) => void;
  };
}

export function useTicketsQuery(
  options: UseTicketsQueryOptions = {},
): TicketsPageResult {
  const { pageSize = 5, initialFilter } = options;
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist ?? false;

  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  // -------------------------------
  // Filter state
  // -------------------------------
  const [rawFilter, setRawFilter] = useState<FilterType>(() => {
    if (initialFilter) return initialFilter;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (
        saved &&
        ["unprocessed", "my", "assigned", "pending", "closed"].includes(saved)
      ) {
        return saved as FilterType;
      }
    }

    return isSpecialist ? "unprocessed" : "my";
  });

  const filter: FilterType = isSpecialist ? rawFilter : "my";

  // -------------------------------
  // Tickets query
  // -------------------------------
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.list({ filter, page }),
    enabled: filter !== "pending",
    queryFn: async (): Promise<PagedTicketList> => {
      switch (filter) {
        case "my":
          return ticketApi.listMy(page, pageSize);

        case "assigned": {
          const response = await ticketApi.listAssigned(page, pageSize);
          return {
            ...response,
            content: response.content.filter(
              (t) => t.status !== "CLOSED" && t.status !== "CANCELLED",
            ),
          };
        }

        case "closed":
          return ticketApi.listByStatus("CLOSED", page, pageSize);

        case "unprocessed":
          return ticketApi.listByStatus("NEW", page, pageSize);

        default:
          return ticketApi.listMy(page, pageSize);
      }
    },
  });

  // -------------------------------
  // Pending assignments query
  // -------------------------------
  const pendingQuery = useQuery({
    queryKey: queryKeys.assignments.pending(page),
    enabled: filter === "pending",
    queryFn: () => assignmentApi.getMyPending(page, pageSize),
  });

  // -------------------------------
  // Optimistic updates
  // -------------------------------
  const addTicket = useCallback(
    (ticket: TicketListItem) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) =>
          old
            ? {
                ...old,
                content: [ticket, ...old.content],
                page: {
                  ...old.page,
                  totalElements: old.page.totalElements + 1,
                },
              }
            : old,
      );
    },
    [queryClient, filter, page],
  );

  const updateTicket = useCallback(
    (ticket: TicketListItem) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) =>
          old
            ? {
                ...old,
                content: old.content.map((t) =>
                  t.id === ticket.id ? ticket : t,
                ),
              }
            : old,
      );
    },
    [queryClient, filter, page],
  );

  const removeTicket = useCallback(
    (ticketId: number) => {
      queryClient.setQueryData<PagedTicketList>(
        queryKeys.tickets.list({ filter, page }),
        (old) =>
          old
            ? {
                ...old,
                content: old.content.filter((t) => t.id !== ticketId),
                page: {
                  ...old.page,
                  totalElements: old.page.totalElements - 1,
                },
              }
            : old,
      );
    },
    [queryClient, filter, page],
  );

  // -------------------------------
  // Actions
  // -------------------------------
  const setFilter = useCallback(
    (next: FilterType) => {
      if (!isSpecialist) return;

      setRawFilter(next);
      setPage(0);

      if (typeof window !== "undefined") {
        localStorage.setItem(FILTER_STORAGE_KEY, next);
      }
    },
    [isSpecialist],
  );

  const refetch = useCallback(() => {
    filter === "pending"
      ? pendingQuery.refetch()
      : ticketsQuery.refetch();
  }, [filter, pendingQuery, ticketsQuery]);

  // -------------------------------
  // Result
  // -------------------------------
  const isPending = filter === "pending";

  return {
    data: isPending ? null : ticketsQuery.data ?? null,

    pendingAssignments: isPending
      ? pendingQuery.data?.content ?? []
      : undefined,

    meta: {
      filter,
      isLoading: isPending
        ? pendingQuery.isLoading
        : ticketsQuery.isLoading,
      isFetching: isPending
        ? pendingQuery.isFetching
        : ticketsQuery.isFetching,
      isError: isPending
        ? pendingQuery.isError
        : ticketsQuery.isError,
    },

    actions: {
      setPage,
      setFilter,
      refetch,
    },

    optimistic: {
      addTicket,
      updateTicket,
      removeTicket,
    },
  };
}
