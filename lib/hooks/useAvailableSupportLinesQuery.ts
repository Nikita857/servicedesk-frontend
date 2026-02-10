import { useQuery } from "@tanstack/react-query";
import { supportLineApi, type SupportLine } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";

interface UseAvailableSupportLinesQuery {
  supportLines: SupportLine[];
  isLoading: boolean;
  error: Error | null;
}

export function useAvailableSupportLinesQuery(): UseAvailableSupportLinesQuery {
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
