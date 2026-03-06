import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";

export function useCoExecutors(ticketId: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.assignments.coExecutors(ticketId),
    queryFn: () => ticketApi.getCoExecutors(ticketId),
    staleTime: 30 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.coExecutors(ticketId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
  };

  const addMutation = useMutation({
    mutationFn: (specialistId: number) => ticketApi.addCoExecutor(ticketId, specialistId),
    onSuccess: () => {
      toast.success("Соисполнитель добавлен");
      invalidate();
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => ticketApi.removeCoExecutor(ticketId, userId),
    onSuccess: () => {
      toast.success("Соисполнитель удалён");
      invalidate();
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  return {
    coExecutors: query.data ?? [],
    isLoading: query.isLoading,
    add: addMutation.mutate,
    isAdding: addMutation.isPending,
    remove: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}
