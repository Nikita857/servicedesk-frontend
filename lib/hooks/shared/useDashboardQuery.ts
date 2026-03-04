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
    queryKey: queryKeys.tickets.list({ statuses: ["NEW", "ESCALATED"], unassigned: true }),
    queryFn: async () => {
      const [newPage, escalatedPage] = await Promise.all([
        ticketApi.listByStatus("NEW", 0, 20),
        ticketApi.listByStatus("ESCALATED", 0, 20),
      ]);

      return [...newPage.content, ...escalatedPage.content]
        .filter((t) => !t.assignedToUsername)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
    },
    staleTime: 30 * 1000,
  });

  return {
    recentTickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    refetch: () => ticketsQuery.refetch(),
  };
}
