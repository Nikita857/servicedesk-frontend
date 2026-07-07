import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";
import { handleApiError, toast } from "@/lib/utils";

export function useCloseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => surveysApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success("Успех", "Опрос закрыт");
    },
    onError: (error) => handleApiError(error, { context: "закрыть опрос" }),
  });
}
