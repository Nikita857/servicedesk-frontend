import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";
import type { SubmitSurveyAnswersRequest } from "@/types/survey";
import { handleApiError, toast } from "@/lib/utils";

export function useSubmitSurveyResponses(surveyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SubmitSurveyAnswersRequest) =>
      surveysApi.submitResponses(surveyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(surveyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.my() });
      toast.success("Спасибо!", "Ваши ответы сохранены");
    },
    onError: (error) => handleApiError(error, { context: "отправить ответы на опрос" }),
  });
}
