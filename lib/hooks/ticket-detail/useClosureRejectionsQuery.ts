import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useClosureRejectionsQuery(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.tickets.closureRejections(ticketId),
    queryFn: () => ticketApi.getClosureRejections(ticketId),
    staleTime: 60_000,
  });
}
