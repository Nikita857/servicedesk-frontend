import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { departmentApi } from "@/lib/api/departments";
import {
  CreateDepartmentRequest,
  CreatePositionRequest,
} from "@/types/department";
import { handleApiError, toast } from "@/lib/utils";

// ─── Departments ───────────────────────────────────────────

export const useDepartments = () =>
  useQuery({
    queryKey: queryKeys.departments.list(),
    queryFn: departmentApi.getDepartments,
  });

export const useDepartment = (id: number) =>
  useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: () => departmentApi.getDepartmentById(id),
    enabled: !!id, // не стреляет если id = 0 или undefined
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) =>
      departmentApi.createDepartment(request),
    onSuccess: () => {
      // Инвалидируем список отделов
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.lists(),
      });
      toast.success("Успех", "Отдел создан");
    },
    onError: (error) => {
      handleApiError(error, { context: "создать отдел" });
    },
  });
};

export const useUpdateDepartment = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDepartmentRequest) =>
      departmentApi.updateDepartment(id, request),
    onSuccess: () => {
      // Инвалидируем и список и конкретный отдел
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.detail(id),
      });
      toast.success("Успех", "Отдел обновлен");
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить отдел" });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.lists(),
      });
      toast.success("Успех", "Отдел удален");
    },
    onError: (error) => {
      handleApiError(error, { context: "удалить отдел" });
    },
  });
};

// ─── Positions ─────────────────────────────────────────────

export const useAllPositions = () =>
  useQuery({
    queryKey: queryKeys.departments.positionsList(),
    queryFn: departmentApi.getAllPositions,
  });

export const usePositionsByDepartment = (departmentId: number) =>
  useQuery({
    queryKey: queryKeys.departments.positionsByDepartment(departmentId),
    queryFn: () => departmentApi.getPositionsByDepartment(departmentId),
    enabled: !!departmentId,
  });

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePositionRequest) =>
      departmentApi.createPosition(request),
    onSuccess: (_, variables) => {
      // Инвалидируем общий список и список конкретного отдела
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.positionsList(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.positionsByDepartment(
          variables.departmentId,
        ),
      });
      toast.success("Успех", "Должность создана");
    },
    onError: (error) => {
      handleApiError(error, { context: "создать должность" });
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => departmentApi.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.positions(),
      });
      toast.success("Успех", "Должность удалена");
    },
    onError: (error) => {
      handleApiError(error, { context: "удалить должность" });
    },
  });
};
