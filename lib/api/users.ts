import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  UserActivityStatus,
  UserSearchResult,
  UserStatusResponse,
} from "@/types/auth";

export const userApi = {
  /**
   * Search users by ФИО or username (min 2 chars). Excludes the current user.
   * Backing for assignee/author pickers — see UserSearchSelect.
   */
  search: async (query: string): Promise<UserSearchResult[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<UserSearchResult>>>(
      "/users/search",
      { params: { q: query } },
    );
    return response.data.data.content;
  },

  /**
   * Get current user's activity status
   */
  getMyStatus: async (): Promise<UserStatusResponse> => {
    const response = await api.get<ApiResponse<UserStatusResponse>>(
      "/users/status"
    );
    return response.data.data;
  },

  /**
   * Get specific user's activity status
   */
  getUserStatus: async (userId: number): Promise<UserStatusResponse> => {
    const response = await api.get<ApiResponse<UserStatusResponse>>(
      `/users/${userId}/status`
    );
    return response.data.data;
  },

  /**
   * Update current user's activity status
   */
  updateMyStatus: async (
    status: UserActivityStatus
  ): Promise<UserStatusResponse> => {
    const response = await api.patch<ApiResponse<UserStatusResponse>>(
      "/users/status",
      { status }
    );
    return response.data.data;
  },

  /**
   * Send heartbeat to keep user status alive
   */
  heartbeat: async (): Promise<void> => {
    await api.post("/users/heartbeat");
  },
};
