import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCancelScheduledTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => scheduledTasksApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledTasks.all });
      toast.success("Успех", "Задача отменена");
    },
    onError: (error) => handleApiError(error, { context: "Отменить задачу" }),
  });
}
