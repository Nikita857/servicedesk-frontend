import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";
import type { CreateSurveyRequest } from "@/types/survey";
import { handleApiError, toast } from "@/lib/utils";

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateSurveyRequest) => surveysApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success("Успех", "Опрос создан и отправлен получателям");
    },
    onError: (error) => handleApiError(error, { context: "создать опрос" }),
  });
}
