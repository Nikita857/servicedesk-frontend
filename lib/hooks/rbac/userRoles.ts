import { rbacApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import {
  AssignUserRolesRequest,
  CreateRoleRequest,
  UpdateRolePermissionsRequest,
  UpdateRoleRequest,
} from "@/types/rbac";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { error } from "next/dist/build/output/log";

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.rbac.roles(),
    queryFn: rbacApi.getAllRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.rbac.permissions(),
    queryFn: rbacApi.getAllPermissions,
  });
}

export function useUserRoles(userId: number) {
  return useQuery({
    queryKey: queryKeys.rbac.userRoles(userId),
    queryFn: () => rbacApi.getUserRoles(userId),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRoleRequest) => rbacApi.createRole(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles() });
      toast.success("Успех", "Роль создана");
    },
    onError: (error) => handleApiError(error, { context: "создать роль" }),
  });
}

export function useUpdateRole(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateRoleRequest) => rbacApi.updateRole(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rbac.roleDetail(id),
      });
      toast.success("Успех", "Роли обновлены");
    },
    onError: (error) => handleApiError(error, { context: "обновить роли" }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rbacApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles() });
      toast.success("Успех", "Роль удалена");
    },
    onError: (error) => handleApiError(error, { context: "удалить роль" }),
  });
}

export function useUpdateRolePermissions(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateRolePermissionsRequest) =>
      rbacApi.updateRolePermissions(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rbac.roleDetail(id),
      });
      toast.success("Успех", "Разрешения обновлены");
    },
    onError: (error) =>
      handleApiError(error, { context: "обновить разрешения" }),
  });
}

export function useAssignUserRoles(userId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AssignUserRolesRequest) =>
      rbacApi.assignUserRoles(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rbac.userRoles(userId),
      });
      toast.success("Успех", "Роль присвоена");
    },
    onError: (error) => handleApiError(error, { context: "присвоить роль" }),
  });
}
