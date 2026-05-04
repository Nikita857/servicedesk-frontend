import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { UpdateScheduledTaskRequest } from "@/types/scheduler";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateScheduledTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: UpdateScheduledTaskRequest;
    }) => scheduledTasksApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledTasks.all });
      toast.success("Успех", "Задача обновлена");
    },
    onError: (error) => handleApiError(error, { context: "Обновить задачу" }),
  });
}
