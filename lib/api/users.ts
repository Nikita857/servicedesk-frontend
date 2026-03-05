import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { UserActivityStatus, UserStatusResponse } from "@/types/auth";

export const userApi = {
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
