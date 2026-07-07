import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";

export function useSurveysQuery(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: queryKeys.surveys.list(page, size),
    queryFn: () => surveysApi.list(page, size),
  });
}
