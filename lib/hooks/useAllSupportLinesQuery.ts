import { useQuery } from "@tanstack/react-query";
import { supportLineApi, type SupportLine } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";

interface UseAllSupportLinesQueryReturn {
  supportLines: SupportLine[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching all support lines
 * Used in ticket creation form for line selection
 */
export function useAllSupportLinesQuery(): UseAllSupportLinesQueryReturn {
  const query = useQuery({
    queryKey: queryKeys.supportLines.list(),
    queryFn: () => supportLineApi.list(),
    staleTime: 5 * 60 * 1000, // Support lines rarely change
  });

  return {
    supportLines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
