import api from "./client";
import type { ApiResponse } from "@/types/api";

// User activity status enum
export type UserActivityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "BUSY"
  | "TECHNICAL_ISSUE"
  | "OFFLINE";

// Response from status endpoints
export interface UserStatusResponse {
  status: UserActivityStatus;
  availableForAssignment: boolean;
  updatedAt: string;
}

// Status labels and colors for UI
export const activityStatusConfig: Record<
  UserActivityStatus,
  {
    label: string;
    color: string;
    description: string;
  }
> = {
  AVAILABLE: {
    label: "Доступен",
    color: "green",
    description: "Готов принимать тикеты",
  },
  UNAVAILABLE: {
    label: "Недоступен",
    color: "gray",
    description: "Не принимает тикеты",
  },
  BUSY: {
    label: "Занят",
    color: "red",
    description: "Выполняет сложную задачу или на встрече",
  },
  TECHNICAL_ISSUE: {
    label: "Техн. проблемы",
    color: "orange",
    description: "Проблемы с интернетом или оборудованием",
  },
  OFFLINE: {
    label: "Оффлайн",
    color: "gray",
    description: "Не в сети",
  },
};

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
};
