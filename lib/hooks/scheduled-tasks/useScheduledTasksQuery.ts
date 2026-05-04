import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { ScheduledTaskFilter } from "@/types/scheduler";
import { useQuery } from "@tanstack/react-query";

export function useScheduledTasksQuery(
  filter: Partial<ScheduledTaskFilter>,
  page: number,
  size = 20,
) {
  return useQuery({
    queryKey: queryKeys.scheduledTasks.list({ ...filter, page, size }),
    queryFn: () => scheduledTasksApi.list(filter, page, size),
  });
}
