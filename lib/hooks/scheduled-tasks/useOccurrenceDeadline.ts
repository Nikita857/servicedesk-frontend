import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { SetOccurrenceDeadlineRequest } from "@/types/scheduler";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSetOccurrenceDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: SetOccurrenceDeadlineRequest;
    }) => scheduledTasksApi.setOccurrenceDeadline(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scheduledTasks.all });
      toast.success("Успех", "Срок этого дня обновлён");
    },
    onError: (e) => handleApiError(e, { context: "Изменить срок вхождения" }),
  });
}

export function useClearOccurrenceDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, occurrenceAt }: { id: number; occurrenceAt: string }) =>
      scheduledTasksApi.clearOccurrenceDeadline(id, occurrenceAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scheduledTasks.all });
      toast.success("Успех", "Переопределение снято");
    },
    onError: (e) => handleApiError(e, { context: "Снять переопределение" }),
  });
}
