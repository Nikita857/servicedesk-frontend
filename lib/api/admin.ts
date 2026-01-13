import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { TicketListItem } from "@/types/ticket";

// ==================== Types ====================

// Paginated response structure from admin API (different from standard PaginatedResponse)
export interface AdminPaginatedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface AdminUser {
  id: number;
  fio: string | null;
  username: string;
  avatarUrl: string | null;
  telegramId: number | null;
  specialist: boolean;
  roles: string[];
  active: boolean;
}

export interface CreateUserParams {
  username: string;
  password: string;
  fio?: string;
  email?: string;
  roles?: string[];
  active?: boolean;
}

// ==================== API ====================

export const adminApi = {
  // Get all users with pagination and search
  getUsers: async (
    page: number = 0,
    size: number = 20,
    search?: string
  ): Promise<AdminPaginatedResponse<AdminUser>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (search) params.append("search", search);

    const response = await api.get<
      ApiResponse<AdminPaginatedResponse<AdminUser>>
    >(`/admin/users?${params.toString()}`);
    return response.data.data;
  },

  // Get users by role with pagination
  getUsersByRole: async (
    role: string,
    page: number = 0,
    size: number = 50
  ): Promise<AdminPaginatedResponse<AdminUser>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await api.get<
      ApiResponse<AdminPaginatedResponse<AdminUser>>
    >(`/admin/users/by-role/${role}?${params.toString()}`);
    return response.data.data;
  },

  // Get user by ID
  getUser: async (id: number): Promise<AdminUser> => {
    const response = await api.get<ApiResponse<AdminUser>>(
      `/admin/users/${id}`
    );
    return response.data.data;
  },

  // Create new user
  createUser: async (params: CreateUserParams): Promise<AdminUser> => {
    const queryParams = new URLSearchParams();
    queryParams.append("username", params.username);
    queryParams.append("password", params.password);
    if (params.fio) queryParams.append("fio", params.fio);
    if (params.email) queryParams.append("email", params.email);
    if (params.roles)
      params.roles.forEach((role) => queryParams.append("roles", role));
    if (params.active !== undefined)
      queryParams.append("active", params.active.toString());

    const response = await api.post<ApiResponse<AdminUser>>(
      `/admin/users?${queryParams.toString()}`
    );
    return response.data.data;
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Change user password
  changePassword: async (id: number, newPassword: string): Promise<void> => {
    await api.put(
      `/admin/users/${id}/password?newPassword=${encodeURIComponent(
        newPassword
      )}`
    );
  },

  // Update user roles
  updateRoles: async (id: number, roles: string[]): Promise<AdminUser> => {
    const queryParams = new URLSearchParams();
    roles.forEach((role) => queryParams.append("roles", role));

    const response = await api.patch<ApiResponse<AdminUser>>(
      `/admin/users/${id}/roles?${queryParams.toString()}`
    );
    return response.data.data;
  },

  // Update user FIO
  updateFio: async (id: number, fio: string): Promise<AdminUser> => {
    const response = await api.patch<ApiResponse<AdminUser>>(
      `/admin/users/${id}/fio?fio=${encodeURIComponent(fio)}`
    );
    return response.data.data;
  },

  // Toggle user active status
  toggleActive: async (id: number, active: boolean): Promise<AdminUser> => {
    const response = await api.patch<ApiResponse<AdminUser>>(
      `/admin/users/${id}/active?active=${active}`
    );
    return response.data.data;
  },

  // ==================== Admin Tickets ====================

  // Get all NEW (unclaimed) tickets
  getNewTickets: async (
    page: number = 0,
    size: number = 20
  ): Promise<AdminPaginatedResponse<TicketListItem>> => {
    const response = await api.get<
      ApiResponse<AdminPaginatedResponse<TicketListItem>>
    >(`/admin/tickets/new?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Get all CLOSED tickets
  getClosedTickets: async (
    page: number = 0,
    size: number = 20
  ): Promise<AdminPaginatedResponse<TicketListItem>> => {
    const response = await api.get<
      ApiResponse<AdminPaginatedResponse<TicketListItem>>
    >(`/admin/tickets/closed?page=${page}&size=${size}`);
    return response.data.data;
  },
};
