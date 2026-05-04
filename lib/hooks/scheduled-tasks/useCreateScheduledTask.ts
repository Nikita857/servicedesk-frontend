import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { CreateScheduledTaskRequest } from "@/types/scheduler";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateScheduledTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateScheduledTaskRequest) =>
      scheduledTasksApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledTasks.all });
      toast.success("Успех", "Задача создана");
    },
    onError: (error) => handleApiError(error, { context: "Создать задачу" }),
  });
}
