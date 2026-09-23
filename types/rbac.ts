export interface PermissionResponse {
  id: number;
  code: string;
  category: string;
  description: string;
  system: boolean;
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  system: boolean;
  permissions: PermissionResponse[];
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type { CreateRoleRequest, UpdateRoleRequest, UpdateRolePermissionsRequest } from '@/lib/api/generated/models';

export interface AssignUserRolesRequest {
  roleCodes: string[];
}

export type { CreateSpecialistTypeRequest, UpdateSpecialistTypeRequest } from '@/lib/api/generated/models';
