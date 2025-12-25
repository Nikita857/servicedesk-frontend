import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/reports";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi } from "@/lib/api/assignments";
import type { TicketListItem } from "@/types/ticket";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";

interface DashboardStats {
  open: number;
  resolved: number;
  overdue: number;
  pendingCount: number;
}

interface UseDashboardQueryReturn {
  recentTickets: TicketListItem[];
  stats: DashboardStats;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching dashboard data using TanStack Query
 * Replaces legacy useState + useEffect pattern
 */
export function useDashboardQuery(): UseDashboardQueryReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  // Stats query using reports API
  const statsQuery = useQuery({
    queryKey: queryKeys.reports.ticketsByStatus(),
    queryFn: async (): Promise<DashboardStats> => {
      const [statusStats, pendingCount] = await Promise.all([
        reportsApi.getStatsByStatus(),
        isSpecialist ? assignmentApi.getPendingCount() : Promise.resolve(0),
      ]);

      const getCount = (status: string) =>
        statusStats.find((s) => s.status === status)?.count ?? 0;

      return {
        open:
          getCount("NEW") +
          getCount("OPEN") +
          getCount("PENDING") +
          getCount("ESCALATED"),
        resolved: getCount("RESOLVED"),
        overdue: 0, // TODO: Add backend endpoint for overdue count
        pendingCount,
      };
    },
    staleTime: 60 * 1000,
  });

  // Recent unassigned tickets query
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.list({ status: "NEW", unassigned: true }),
    queryFn: async () => {
      const response = await ticketApi.list(0, 20);
      // Filter to unassigned NEW/PENDING tickets
      return response.content
        .filter(
          (t) =>
            !t.assignedToUsername &&
            (t.status === "NEW" || t.status === "PENDING")
        )
        .slice(0, 5);
    },
    staleTime: 30 * 1000,
  });

  const refetch = () => {
    statsQuery.refetch();
    ticketsQuery.refetch();
  };

  return {
    recentTickets: ticketsQuery.data ?? [],
    stats: statsQuery.data ?? { open: 0, resolved: 0, overdue: 0, pendingCount: 0 },
    isLoading: statsQuery.isLoading || ticketsQuery.isLoading,
    refetch,
  };
}
