"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  wikiApi,
  WikiCategory,
  CreateWikiCategoryRequest,
  UpdateWikiCategoryRequest,
} from "@/lib/api/wiki";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import { useAuthStore } from "@/stores";

interface UseWikiCategoriesAdminReturn {
  categories: WikiCategory[];
  isLoading: boolean;
  error: Error | null;
  createCategory: (data: CreateWikiCategoryRequest) => void;
  updateCategory: (id: number, data: UpdateWikiCategoryRequest) => void;
  deleteCategory: (id: number) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useWikiCategoriesAdmin(): UseWikiCategoriesAdminReturn {
  const queryClient = useQueryClient();

  // Query to get all admin categories
  const categoriesQuery = useQuery({
    queryKey: queryKeys.wiki.adminCategories(),
    queryFn: wikiApi.adminGetCategories,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateWikiCategoryRequest) =>
      wikiApi.adminCreateCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wiki.adminCategories(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.all });
      toast.success("Категория создана");
    },
    onError: (error) => {
      handleApiError(error, { context: "создать категорию" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateWikiCategoryRequest;
    }) => wikiApi.adminUpdateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wiki.adminCategories(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.all });
      toast.success("Категория обновлена");
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить категорию" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => wikiApi.adminDeleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wiki.adminCategories(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.wiki.all });
      toast.success("Категория удалена");
    },
    onError: (error) => {
      handleApiError(error, { context: "удалить категорию" });
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: (data) => createMutation.mutate(data),
    updateCategory: (id, data) => updateMutation.mutate({ id, data }),
    deleteCategory: (id) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
