import { useQuery } from "@tanstack/react-query";
import { wikiApi, type WikiCategory } from "@/lib/api/wiki";
import { queryKeys } from "@/lib/queryKeys";

interface UseWikiCategoriesQueryOptions {
  showAll?: boolean;
}

/**
 * Hook for fetching wiki categories
 */
export function useWikiCategoriesQuery(
  options: UseWikiCategoriesQueryOptions = {}
) {
  const { showAll = false } = options;

  return useQuery({
    queryKey: queryKeys.wiki.categories(showAll),
    queryFn: () => wikiApi.getCategories(showAll),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
