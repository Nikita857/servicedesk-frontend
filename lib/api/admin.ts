import { SenderType } from "@/types";
import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { TicketListResponse } from "@/types/ticket";
import { handleApiError } from "../utils";
import type { WikiCategoryTree } from "@/types/wiki";
import type { AdminUserResponse, CreateUserRequest, DepartmentResponse, PositionResponse } from "@/types/admin";

// ==================== API ====================

export const adminApi = {
  // Get all users with pagination and search
  getUsers: async (
    page: number = 0,
    size: number = 20,
    search?: string,
  ): Promise<PaginatedResponse<AdminUserResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (search) params.append("search", search);

    const response = await api.get<
      ApiResponse<PaginatedResponse<AdminUserResponse>>
    >(`/admin/users?${params.toString()}`);
    return response.data.data;
  },

  // Get users by role with pagination
  getUsersByRole: async (
    role: string,
    page: number = 0,
    size: number = 50,
  ): Promise<PaginatedResponse<AdminUserResponse>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await api.get<
      ApiResponse<PaginatedResponse<AdminUserResponse>>
    >(`/admin/users/by-role/${role}?${params.toString()}`);
    return response.data.data;
  },

  // Get user by ID
  getUser: async (id: number): Promise<AdminUserResponse> => {
    const response = await api.get<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}`,
    );
    return response.data.data;
  },

  // Create new user
  createUser: async (params: CreateUserRequest): Promise<AdminUserResponse> => {

  const payload: Partial<CreateUserRequest> = {
    username: params.username,
    password: params.password,
    fio: params.fio,
    email: params.email ?? null,
    roles: params.roles ?? [],
    active: params.active,
    departmentId: params.departmentId ?? null,
    positionId: params.positionId ?? null,
  };

  try {
    const response = await api.post<ApiResponse<AdminUserResponse>>(
      "/admin/users",           // без query-параметров
      payload                   // ← JSON в теле
    );
    return response.data.data;
  } catch (error) {
    handleApiError(error, {context: "создать пользователя"})
    throw error;
  }
},

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Change user password
  changePassword: async (id: number, newPassword: string): Promise<void> => {
    await api.put(
      `/admin/users/${id}/password?newPassword=${encodeURIComponent(
        newPassword,
      )}`,
    );
  },

  // Update user roles
  updateRoles: async (id: number, roles: string[]): Promise<AdminUserResponse> => {
    const queryParams = new URLSearchParams();
    roles.forEach((role) => queryParams.append("roles", role));

    const response = await api.patch<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}/roles?${queryParams.toString()}`,
    );
    return response.data.data;
  },

  // Update user FIO
  updateFio: async (id: number, fio: string): Promise<AdminUserResponse> => {
    const response = await api.patch<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}/fio?fio=${encodeURIComponent(fio)}`,
    );
    return response.data.data;
  },

  // Toggle user active status
  toggleActive: async (id: number, active: boolean): Promise<AdminUserResponse> => {
    const response = await api.patch<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}/active?active=${active}`,
    );
    return response.data.data;
  },

  // Update user department and position
  updateDepartmentAndPosition: async (
    id: number,
    departmentId?: number | null,
    positionId?: number | null,
  ): Promise<AdminUserResponse> => {
    const queryParams = new URLSearchParams();
    if (departmentId !== undefined)
      queryParams.append(
        "departmentId",
        departmentId === null ? "" : departmentId.toString(),
      );
    if (positionId !== undefined)
      queryParams.append(
        "positionId",
        positionId === null ? "" : positionId.toString(),
      );

    const response = await api.patch<ApiResponse<AdminUserResponse>>(
      `/admin/users/${id}/department-position?${queryParams.toString()}`,
    );
    return response.data.data;
  },

  // ==================== Admin Tickets ====================

  // Get all NEW (unclaimed) tickets
  getNewTickets: async (
    page: number = 0,
    size: number = 20,
  ): Promise<PaginatedResponse<TicketListResponse>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<TicketListResponse>>
    >(`/admin/tickets/new?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Get all CLOSED tickets
  getClosedTickets: async (
    page: number = 0,
    size: number = 20,
  ): Promise<PaginatedResponse<TicketListResponse>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<TicketListResponse>>
    >(`/admin/tickets/closed?page=${page}&size=${size}`);
    return response.data.data;
  },

  // ==================== Departments ====================

  getDepartments: async (): Promise<DepartmentResponse[]> => {
    const response =
      await api.get<ApiResponse<DepartmentResponse[]>>("/admin/departments");
    return response.data.data;
  },

  // Get all positions
  getAllPositions: async (): Promise<PositionResponse[]> => {
    const response = await api.get<ApiResponse<PositionResponse[]>>(
      "/admin/departments/positions",
    );
    return response.data.data;
  },

  // Get positions by department
  getPositionsByDepartment: async (
    departmentId: number,
  ): Promise<PositionResponse[]> => {
    const response = await api.get<ApiResponse<PositionResponse[]>>(
      `/admin/departments/${departmentId}/positions`,
    );
    return response.data.data;
  },

  getCategoriesTree: async (): Promise<WikiCategoryTree[]> => {
    const response = await api.get<ApiResponse<WikiCategoryTree[]>>(
      `/wiki/categories/tree`
    );
    return response.data.data;
  }
};
