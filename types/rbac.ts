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

export interface CreateRoleRequest {
  code: string; // формат: ROLE_[A-Z_]+
  name: string;
  color: string;
  description?: string;
  permissionCodes?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface UpdateRolePermissionsRequest {
  permissionCodes: string[];
}

export interface AssignUserRolesRequest {
  roleCodes: string[];
}

export interface CreateSpecialistTypeRequest {
  code: string;
  name: string;
  displayOrder?: number;
}

export interface UpdateSpecialistTypeRequest {
  code?: string;
  name?: string;
  displayOrder?: number;
  active?: boolean;
}
