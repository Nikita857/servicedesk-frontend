import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { useQuery } from "@tanstack/react-query";

export function useScheduledTaskDeadlineQuery(ticketId: number) {
  return useQuery({
    queryKey: ["scheduled-tasks", "by-ticket", ticketId],
    queryFn: () => scheduledTasksApi.getByTicket(ticketId),
    staleTime: 60_000,
  });
}
