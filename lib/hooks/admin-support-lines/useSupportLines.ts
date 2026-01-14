import { useQuery } from "@tanstack/react-query";
import { supportLineApi } from "@/lib/api/supportLines";

/**
 * Hook for fetching all support lines for admin management.
 */
export function useSupportLines() {
  const query = useQuery({
    queryKey: ["support-lines"],
    queryFn: supportLineApi.list,
    staleTime: 30 * 1000,
  });

  return {
    lines: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
