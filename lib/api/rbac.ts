import type { AssignUserRolesRequest, CreateRoleRequest, PermissionResponse, RoleResponse, UpdateRolePermissionsRequest, UpdateRoleRequest } from '@/types/rbac';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const rbacApi = {
  getAllRoles: async (): Promise<RoleResponse[]> => (await generated.getAll1()).data as RoleResponse[],
  getRoleById: async (id: number): Promise<RoleResponse> => (await generated.getById1(id)).data as RoleResponse,
  createRole: async (request: CreateRoleRequest): Promise<RoleResponse> => (await generated.createRole(request)).data as RoleResponse,
  updateRole: async (id: number, request: UpdateRoleRequest): Promise<RoleResponse> => (await generated.updateRole(id, request)).data as RoleResponse,
  deleteRole: async (id: number): Promise<void> => { await generated.deleteRole(id); },
  updateRolePermissions: async (id: number, request: UpdateRolePermissionsRequest): Promise<RoleResponse> => (await generated.updatePermissions(id, request)).data as RoleResponse,
  getAllPermissions: async (): Promise<PermissionResponse[]> => (await generated.getPermissions()).data as PermissionResponse[],
  getUserRoles: async (userId: number): Promise<RoleResponse[]> => (await generated.getUserRoles(userId)).data as RoleResponse[],
  assignUserRoles: async (userId: number, request: AssignUserRolesRequest): Promise<void> => { await generated.updateRoles(userId, { roles: request.roleCodes }); },
};
