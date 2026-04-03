import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { SupportLineListResponse, SupportLineDetail, Specialist, CreateSupportLineRequest, UpdateSupportLineRequest, UpdateSupportLineChatId } from "@/types/support-line";

// ==================== API ====================

export const supportLineApi = {
  // Get all support lines
  list: async (): Promise<SupportLineListResponse[]> => {
    const response = await api.get<ApiResponse<SupportLineListResponse[]>>(
      "/support-lines"
    );
    return response.data.data;
  },

  // Alias for list
  getAll: async (): Promise<SupportLineListResponse[]> => {
    const response = await api.get<ApiResponse<SupportLineListResponse[]>>(
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

  getAvailableForAssignment: async (): Promise<SupportLineListResponse[]> => {
    const response = await api.get<ApiResponse<SupportLineListResponse[]>>(
      `/support-lines/available-for-assignment`
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
  getMyLines: async (): Promise<SupportLineListResponse[]> => {
    const response = await api.get<ApiResponse<SupportLineListResponse[]>>(
      "/support-lines/my-lines"
    );
    return response.data.data;
  },

  // ==================== Admin Methods ====================

  // Create support line (admin only)
  create: async (data: CreateSupportLineRequest): Promise<SupportLineDetail> => {
    const response = await api.post<ApiResponse<SupportLineDetail>>(
      "/admin/support-line",
      data
    );
    return response.data.data;
  },

  // Delete support line (admin only)
  deleteLine: async (id: number): Promise<void> => {
    await api.delete(`/admin/support-line/${id}`);
  },

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

  // Update chat IDs for all messengers (admin only)
  updateChatIds: async (
    lineId: number,
    data: UpdateSupportLineChatId
  ): Promise<SupportLineDetail> => {
    const response = await api.patch<ApiResponse<SupportLineDetail>>(
      `/admin/support-line/${lineId}/chat`,
      data
    );
    return response.data.data;
  },
};

export type { Specialist };
