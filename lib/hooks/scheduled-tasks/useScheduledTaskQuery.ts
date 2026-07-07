import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useScheduledTaskQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.scheduledTasks.detail(id),
    queryFn: () => scheduledTasksApi.getById(id),
  });
}
