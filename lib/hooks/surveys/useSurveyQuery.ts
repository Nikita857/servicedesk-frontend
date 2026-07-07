import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";

export function useSurveyQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.surveys.detail(id),
    queryFn: () => surveysApi.getById(id),
    enabled: !!id,
  });
}
