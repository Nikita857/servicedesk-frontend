import { useState, useEffect, useCallback } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import type { TicketListItem, PagedTicketList } from "@/types/ticket";

export type FilterType = "unprocessed" | "my" | "assigned" | "pending";

interface UseTicketsListReturn {
  tickets: TicketListItem[];
  pendingAssignments: Assignment[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  filter: FilterType;
  setPage: (page: number) => void;
  setFilter: (filter: FilterType) => void;
  refresh: () => Promise<void>;
  // For WebSocket updates
  addTicket: (ticket: TicketListItem) => void;
  updateTicketInList: (ticket: TicketListItem) => void;
  removeTicket: (ticketId: number) => void;
}

export function useTicketsList(): UseTicketsListReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<FilterType>(
    isSpecialist ? "unprocessed" : "my"
  );

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (filter === "pending") {
        const response = await assignmentApi.getMyPending(page, 5);
        setPendingAssignments(response.content);
        setTickets([]);
        setTotalPages(response.totalPages);
      } else {
        let response: PagedTicketList;

        switch (filter) {
          case "my":
            response = await ticketApi.listMy(page, 5);
            break;
          case "assigned":
            response = await ticketApi.listAssigned(page, 5);
            break;
          case "unprocessed":
            response = await ticketApi.list(page, 5);
            response = {
              ...response,
              content: response.content.filter((t) => t.status === "NEW"),
            };
            break;
          default:
            response = await ticketApi.listMy(page, 5);
        }

        setTickets(response.content);
        setPendingAssignments([]);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось загрузить список тикетов",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-switch filter for non-specialists
  useEffect(() => {
    if (!isSpecialist && filter !== "my") {
      setFilter("my");
    }
  }, [isSpecialist, filter]);

  // Methods for WebSocket updates (without full refetch)
  const addTicket = useCallback((ticket: TicketListItem) => {
    setTickets((prev) => [ticket, ...prev]);
  }, []);

  const updateTicketInList = useCallback((updatedTicket: TicketListItem) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  }, []);

  const removeTicket = useCallback((ticketId: number) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  }, []);

  const handleSetFilter = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(0);
  }, []);

  return {
    tickets,
    pendingAssignments,
    isLoading,
    page,
    totalPages,
    filter,
    setPage,
    setFilter: handleSetFilter,
    refresh: fetchTickets,
    addTicket,
    updateTicketInList,
    removeTicket,
  };
}
