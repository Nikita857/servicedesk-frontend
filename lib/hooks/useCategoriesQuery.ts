import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";

interface Category {
  id: number;
  name: string;
}

interface CategoriesResponse {
  data: Category[];
}

/**
 * Hook for fetching user-selectable categories
 * Used in new ticket form for category selection
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.userSelectable(),
    queryFn: async (): Promise<Category[]> => {
      const response = await api.get<CategoriesResponse>("/categories/user-selectable");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Categories rarely change, cache for 5 minutes
  });
}
