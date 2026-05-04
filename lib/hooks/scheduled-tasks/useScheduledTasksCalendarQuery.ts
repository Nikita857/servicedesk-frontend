import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { DateWindow } from "@/types/scheduler";
import { useQuery } from "@tanstack/react-query";

export function useScheduledTasksCalendarQuery(window: DateWindow) {
  return useQuery({
    queryKey: queryKeys.scheduledTasks.calendar(window),
    queryFn: () => scheduledTasksApi.getCalendar(window),
  });
}
