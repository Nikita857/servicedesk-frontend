import { useQuery } from "@tanstack/react-query";
import { categoriesApi, Category } from "@/lib/api/categories";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook for fetching user-selectable categories
 * Used in new ticket form for category selection
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.userSelectable(),
    queryFn: () => categoriesApi.getUserSelectable(),
    staleTime: 5 * 60 * 1000, // Categories rarely change, cache for 5 minutes
  });
}

/**
 * Hook for fetching category details
 */
export function useCategoryDetailQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id || 0),
    queryFn: () => categoriesApi.getDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
