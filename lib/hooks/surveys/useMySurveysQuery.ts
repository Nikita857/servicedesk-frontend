import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { surveysApi } from "@/lib/api/surveys";

export function useMySurveysQuery() {
  return useQuery({
    queryKey: queryKeys.surveys.my(),
    queryFn: () => surveysApi.getMy(),
  });
}
