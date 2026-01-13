import api from "./client";
import type { ApiResponse } from "@/types/api";

// ==================== Types ====================

export type AssignmentMode =
  | "FIRST_AVAILABLE"
  | "ROUND_ROBIN"
  | "LEAST_LOADED"
  | "DIRECT";

export type ActivityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "BUSY"
  | "TECHNICAL_ISSUE"
  | "OFFLINE"
  | "ON_BREAK";

export interface Specialist {
  id: number;
  username: string;
  fio: string | null;
  active: boolean;
  roles: string[];
  activityStatus?: ActivityStatus;
  availableForAssignment?: boolean;
}

export interface SupportLine {
  id: number;
  name: string;
  description: string | null;
  slaMinutes: number;
  specialistCount: number;
  displayOrder: number;
}

// Full version with specialists and assignment mode
export interface SupportLineDetail extends SupportLine {
  assignmentMode: AssignmentMode;
  targetRole: string;
  specialists: Specialist[];
  telegramChatId?: number | null;
}

// Alias for backwards compatibility
export type SupportLineShort = SupportLine;

export interface UpdateSupportLineRequest {
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  displayOrder?: number;
}

// ==================== API ====================

export const supportLineApi = {
  // Get all support lines
  list: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>(
      "/support-lines"
    );
    return response.data.data;
  },

  // Alias for list
  getAll: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>(
      "/support-lines"
    );
    return response.data.data;
  },

  // Get support line by ID (full detail)
  get: async (id: number): Promise<SupportLineDetail> => {
    const response = await api.get<ApiResponse<SupportLineDetail>>(
      `/support-lines/${id}`
    );
    return response.data.data;
  },

  // Get specialists in a support line
  getSpecialists: async (lineId: number): Promise<Specialist[]> => {
    const response = await api.get<ApiResponse<Specialist[]>>(
      `/support-lines/${lineId}/specialists`
    );
    return response.data.data;
  },

  // Get my lines (for specialists)
  getMyLines: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>(
      "/support-lines/my-lines"
    );
    return response.data.data;
  },

  // ==================== Admin Methods ====================

  // Update support line (admin only)
  update: async (
    id: number,
    data: UpdateSupportLineRequest
  ): Promise<SupportLineDetail> => {
    const response = await api.put<ApiResponse<SupportLineDetail>>(
      `/admin/support-line/${id}`,
      data
    );
    return response.data.data;
  },

  // Add specialist to line (admin only)
  addSpecialist: async (
    lineId: number,
    userId: number
  ): Promise<SupportLineDetail> => {
    const response = await api.post<ApiResponse<SupportLineDetail>>(
      `/admin/support-line/${lineId}/specialists/${userId}`
    );
    return response.data.data;
  },

  // Remove specialist from line (admin only)
  removeSpecialist: async (
    lineId: number,
    userId: number
  ): Promise<SupportLineDetail> => {
    const response = await api.delete<ApiResponse<SupportLineDetail>>(
      `/admin/support-line/${lineId}/specialists/${userId}`
    );
    return response.data.data;
  },

  // Link Telegram chat to line (admin only)
  linkTelegram: async (
    lineId: number,
    telegramChatId: number
  ): Promise<SupportLineDetail> => {
    const response = await api.patch<ApiResponse<SupportLineDetail>>(
      `/admin/support-line/${lineId}/telegram-chat?telegramChatId=${telegramChatId}`
    );
    return response.data.data;
  },
};

// Assignment API - forwarding related
export const assignmentApi = {
  /**
   * Get available lines for forwarding based on user role
   * Respects forwarding rules: SYSADMIN → 1CSUPPORT, etc.
   */
  getAvailableForwardingLines: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>(
      "/assignments/available-lines"
    );
    return response.data.data;
  },
};
