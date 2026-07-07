import { ApiResponse } from "@/types";
import api from "./client";
import {
  AssignUserRolesRequest,
  CreateRoleRequest,
  PermissionResponse,
  RoleResponse,
  UpdateRolePermissionsRequest,
  UpdateRoleRequest,
} from "@/types/rbac";

export const rbacApi = {
  getAllRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<ApiResponse<RoleResponse[]>>("/rbac/roles");
    return response.data.data;
  },

  getRoleById: async (id: number): Promise<RoleResponse> => {
    const response = await api.get<ApiResponse<RoleResponse>>(
      `/rbac/roles/${id}`,
    );
    return response.data.data;
  },

  createRole: async (request: CreateRoleRequest): Promise<RoleResponse> => {
    const response = await api.post<ApiResponse<RoleResponse>>(
      "/rbac/roles",
      request,
    );
    return response.data.data;
  },

  updateRole: async (
    id: number,
    request: UpdateRoleRequest,
  ): Promise<RoleResponse> => {
    const response = await api.put<ApiResponse<RoleResponse>>(
      `/rbac/roles/${id}`,
      request,
    );
    return response.data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/rbac/roles/${id}`);
  },

  updateRolePermissions: async (
    id: number,
    request: UpdateRolePermissionsRequest,
  ): Promise<RoleResponse> => {
    const response = await api.put<ApiResponse<RoleResponse>>(
      `/rbac/roles/${id}/permissions`,
      request,
    );
    return response.data.data;
  },

  getAllPermissions: async (): Promise<PermissionResponse[]> => {
    const response =
      await api.get<ApiResponse<PermissionResponse[]>>("/rbac/permissions");
    return response.data.data;
  },

  getUserRoles: async (userId: number): Promise<RoleResponse[]> => {
    const response = await api.get<ApiResponse<RoleResponse[]>>(
      `/admin/users/${userId}/roles`,
    );
    return response.data.data;
  },

  assignUserRoles: async (
    userId: number,
    request: AssignUserRolesRequest,
  ): Promise<void> => {
    await api.patch<ApiResponse<void>>(`/admin/users/${userId}/roles`, null, {
      params: { roleCodes: request.roleCodes },
    });
  },
};
