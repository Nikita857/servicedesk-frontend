import { assignmentApi } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCancelAssignment(ticketId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      reason,
    }: {
      assignmentId: number;
      reason: string;
    }) => assignmentApi.cancel(assignmentId, { reason }),
    onSuccess: () => {
      toast.success("Назначение отменено");
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(ticketId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
}
