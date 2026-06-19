import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { specialistTypeApi } from "@/lib/api/specialistTypes";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import type { CreateSpecialistTypeRequest, UpdateSpecialistTypeRequest } from "@/types/rbac";

export function useSpecialistTypes() {
  const { data: specialistTypes = [], isLoading } = useQuery({
    queryKey: queryKeys.specialistTypes.list(),
    queryFn: () => specialistTypeApi.getAll(),
    staleTime: 30 * 1000,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (req: CreateSpecialistTypeRequest) => specialistTypeApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialistTypes.list() });
      toast.success("Успех", "Тип специалиста создан");
    },
    onError: (error) => handleApiError(error, { context: "создать тип специалиста" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: UpdateSpecialistTypeRequest }) =>
      specialistTypeApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialistTypes.list() });
      toast.success("Успех", "Тип специалиста обновлён");
    },
    onError: (error) => handleApiError(error, { context: "обновить тип специалиста" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => specialistTypeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialistTypes.list() });
      toast.success("Успех", "Тип специалиста удалён");
    },
    onError: (error) => handleApiError(error, { context: "удалить тип специалиста" }),
  });

  return {
    specialistTypes,
    isLoading,
    createSpecialistType: (req: CreateSpecialistTypeRequest) => createMutation.mutate(req),
    updateSpecialistType: (id: number, req: UpdateSpecialistTypeRequest) =>
      updateMutation.mutate({ id, req }),
    deleteSpecialistType: (id: number) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
