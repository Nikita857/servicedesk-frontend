import type { PaginatedResponse } from '@/types/api';
import type { TicketListResponse } from '@/types/ticket';
import type { WikiCategoryTree } from '@/types/wiki';
import type { AdminUserResponse, BackupResponse, CreateUserRequest } from '@/types/admin';
import type { CreateUserRequest as WireCreateUserRequest, PageObjectOfUserAuthResponse, PageObjectOfTicketListResponse } from './generated/models';
import { handleApiError } from '../utils';
import { getServiceDeskAPI } from './generated/client';
import { toUserView } from './userAuthView';

const generated = getServiceDeskAPI();

function asPage<T>(wire: PageObjectOfTicketListResponse | undefined): PaginatedResponse<T> {
  return {
    content: (wire?.content ?? []) as T[],
    page: {
      number: wire?.number ?? 0, size: wire?.size ?? 0,
      totalElements: wire?.totalElements ?? 0, totalPages: wire?.totalPages ?? 0,
    },
  };
}

function asUserPage(wire: PageObjectOfUserAuthResponse | undefined): PaginatedResponse<AdminUserResponse> {
  return {
    content: (wire?.content ?? []).map(toUserView),
    page: {
      number: wire?.number ?? 0, size: wire?.size ?? 0,
      totalElements: wire?.totalElements ?? 0, totalPages: wire?.totalPages ?? 0,
    },
  };
}

export const adminApi = {
  getUsers: async (page = 0, size = 20, search?: string): Promise<PaginatedResponse<AdminUserResponse>> =>
    asUserPage((await generated.getAllUsers({ page, size, ...(search ? { search } : {}) })).data),
  getUsersByRole: async (role: string, page = 0, size = 50): Promise<PaginatedResponse<AdminUserResponse>> =>
    asUserPage((await generated.getUsersByRole(role, { page, size })).data),
  getUser: async (id: number): Promise<AdminUserResponse> => toUserView((await generated.getUser(id)).data),
  createUser: async (params: CreateUserRequest): Promise<AdminUserResponse> => {
    const payload = {
      username: params.username, password: params.password, fio: params.fio,
      email: params.email ?? null, roles: params.roles ?? [], active: params.active,
      departmentId: params.departmentId ?? null, positionId: params.positionId ?? null,
      specialistTypeCode: params.specialistType ?? null,
    } as WireCreateUserRequest;
    try {
      return toUserView((await generated.createUser(payload)).data);
    } catch (error) {
      handleApiError(error, { context: 'создать пользователя' });
      throw error;
    }
  },
  deleteUser: async (id: number): Promise<void> => { await generated.deleteUser(id); },
  changePassword: async (id: number, newPassword: string): Promise<void> => { await generated.changePassword1(id, { newPassword }); },
  updateRoles: async (id: number, roles: string[]): Promise<AdminUserResponse> =>
    toUserView((await generated.updateRoles(id, { roles })).data),
  updateFio: async (id: number, fio: string): Promise<AdminUserResponse> =>
    toUserView((await generated.updateFio(id, { fio })).data),
  toggleActive: async (id: number, active: boolean): Promise<AdminUserResponse> =>
    toUserView((await generated.toggleActive(id, { active })).data),
  updateSpecialistType: async (id: number, code: string | null): Promise<AdminUserResponse> =>
    toUserView((await generated.updateSpecialistType(id, code ? { code } : undefined)).data),
  updateDepartmentAndPosition: async (id: number, departmentId?: number | null, positionId?: number | null): Promise<AdminUserResponse> =>
    toUserView((await generated.updateDepartmentAndPosition(id, {
      ...(departmentId !== undefined ? { departmentId: departmentId === null ? '' : String(departmentId) } : {}),
      ...(positionId !== undefined ? { positionId: positionId === null ? '' : String(positionId) } : {}),
    })).data),
  getNewTickets: async (page = 0, size = 20): Promise<PaginatedResponse<TicketListResponse>> =>
    asPage<TicketListResponse>((await generated.getNewTickets({ page, size })).data),
  getClosedTickets: async (page = 0, size = 20): Promise<PaginatedResponse<TicketListResponse>> =>
    asPage<TicketListResponse>((await generated.getClosedTickets({ page, size })).data),
  getCategoriesTree: async (): Promise<WikiCategoryTree[]> =>
    (await generated.getCategoryTree()).data as WikiCategoryTree[],
  runBackup: async (): Promise<BackupResponse> => (await generated.runBackup()).data as BackupResponse,
};
