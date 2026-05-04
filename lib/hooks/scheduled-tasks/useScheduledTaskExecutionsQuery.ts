import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useScheduledTaskExecutionsQuery(id: number, page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.scheduledTasks.executions(id),
    queryFn: () => scheduledTasksApi.getExecutions(id, page, size),
    enabled: !!id,
  });
}
