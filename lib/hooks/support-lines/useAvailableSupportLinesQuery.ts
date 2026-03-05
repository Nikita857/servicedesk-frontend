import { useQuery } from "@tanstack/react-query";
import { supportLineApi } from "@/lib/api/supportLines";
import type { SupportLineListResponse } from "@/types/support-line";
import { queryKeys } from "@/lib/queryKeys";

interface UseAvailableSupportLinesQueryReturn {
  supportLines: SupportLineListResponse[];
  isLoading: boolean;
  error: Error | null;
}

export function useAvailableSupportLinesQuery(): UseAvailableSupportLinesQueryReturn {
  const query = useQuery({
    queryKey: queryKeys.supportLines.available(),
    queryFn: () => supportLineApi.getAvailableForAssignment(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    supportLines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
