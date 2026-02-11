import { useQuery } from "@tanstack/react-query";
import { ticketApi } from "@/lib/api/tickets";
import type { TicketListItem } from "@/types/ticket";
import { queryKeys } from "@/lib/queryKeys";

interface UseDashboardQueryReturn {
  recentTickets: TicketListItem[];
  isLoading: boolean;
  refetch: () => void;
}

export function useDashboardQuery(): UseDashboardQueryReturn {
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.list({ status: "NEW", unassigned: true }),
    queryFn: async () => {
      const response = await ticketApi.listByStatus("NEW", 0, 20);
      return response.content.filter((t) => !t.assignedToUsername).slice(0, 5);
    },
    staleTime: 30 * 1000,
  });

  return {
    recentTickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    refetch: () => ticketsQuery.refetch(),
  };
}
