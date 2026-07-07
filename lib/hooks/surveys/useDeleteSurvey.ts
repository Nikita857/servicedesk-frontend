import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";
import { handleApiError, toast } from "@/lib/utils";

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => surveysApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success("Успех", "Опрос удалён");
    },
    onError: (error) => handleApiError(error, { context: "удалить опрос" }),
  });
}
