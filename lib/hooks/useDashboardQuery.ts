import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/reports";
import { ticketApi } from "@/lib/api/tickets";
import { statsApi } from "@/lib/api/stats";
import { assignmentApi } from "@/lib/api/assignments";
import type { TicketListItem } from "@/types/ticket";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";

interface DashboardStats {
  open: number;
  resolved: number;
  closed: number;
  overdue: number;
  pendingCount: number;
}

interface UseDashboardQueryReturn {
  recentTickets: TicketListItem[];
  stats: DashboardStats;
  isLoading: boolean;
  refetch: () => void;
}

export function useDashboardQuery(): UseDashboardQueryReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const isAdmin = user?.roles.includes("ADMIN") || false;

  // Stats query using reports API
  const statsQuery = useQuery({
    queryKey: queryKeys.reports.ticketsByStatus(),
    queryFn: async (): Promise<DashboardStats> => {
      const [statusStats, pendingCount, lineStatsResponse] = await Promise.all([
        isAdmin
          ? reportsApi.getStatsByStatus().catch(() => [])
          : Promise.resolve([]),
        isSpecialist ? assignmentApi.getPendingCount() : Promise.resolve(0),
        isSpecialist
          ? statsApi.getStatsByAllLines().catch(() => null)
          : Promise.resolve(null),
      ]);

      const lineStats = lineStatsResponse?.content ?? [];

      const getCount = (status: string) =>
        statusStats.find((s) => s.status === status)?.count ?? 0;

      let openCount =
        getCount("NEW") +
        getCount("OPEN") +
        getCount("PENDING") +
        getCount("ESCALATED");
      let resolvedCount = getCount("RESOLVED");
      let closedCount = getCount("CLOSED");

      // Fallback for specialists if reportsApi failed
      if (statusStats.length === 0 && lineStats.length > 0) {
        openCount = lineStats.reduce(
          (acc, line) => acc + line.newTickets + line.open,
          0
        );
        resolvedCount = lineStats.reduce((acc, line) => acc + line.resolved, 0);
        closedCount = lineStats.reduce((acc, line) => acc + line.closed, 0);
      }

      return {
        open: openCount,
        resolved: resolvedCount,
        closed: closedCount,
        overdue: 0,
        pendingCount,
      };
    },
    staleTime: 0,
  });

  // Recent unassigned tickets query
  const ticketsQuery = useQuery({
    queryKey: queryKeys.tickets.list({ status: "NEW", unassigned: true }),
    queryFn: async () => {
      const response = await ticketApi.listByStatus("NEW", 0, 20);
      // Filter to unassigned tickets
      return response.content.filter((t) => !t.assignedToUsername).slice(0, 5);
    },
    staleTime: 30 * 1000,
  });

  const refetch = () => {
    statsQuery.refetch();
    ticketsQuery.refetch();
  };

  return {
    recentTickets: ticketsQuery.data ?? [],
    stats: statsQuery.data ?? {
      open: 0,
      resolved: 0,
      closed: 0,
      overdue: 0,
      pendingCount: 0,
    },
    isLoading: statsQuery.isLoading || ticketsQuery.isLoading,
    refetch,
  };
}
