import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {categoriesApi} from "@/lib/api/categories";
import {handleApiError, toast} from "@/lib/utils";
import type {CreateCategoryRequest, UpdateCategoryRequest} from "@/types/category";

export function useCategories() {
  const queryClient = useQueryClient();

  const {data: categories = [], isLoading} = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-categories"]});
      queryClient.invalidateQueries({queryKey: ["categories"]});
      toast.success("Категория создана");
    },
    onError: (error) => handleApiError(error),
  });

  const updateMutation = useMutation({
    mutationFn: ({id, data}: { id: number; data: UpdateCategoryRequest }) =>
        categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-categories"]});
      queryClient.invalidateQueries({queryKey: ["categories"]});
      toast.success("Категория обновлена");
    },
    onError: (error) => handleApiError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-categories"]});
      queryClient.invalidateQueries({queryKey: ["categories"]});
      toast.success("Категория удалена");
    },
    onError: (error) => handleApiError(error),
  });

  return {
    categories,
    isLoading,
    createCategory: (data: CreateCategoryRequest) => createMutation.mutate(data),
    updateCategory: (id: number, data: UpdateCategoryRequest) =>
        updateMutation.mutate({id, data}),
    deleteCategory: (id: number) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
