import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  AnnouncementDetailResponse,
  AnnouncementManagementResponse,
  CreateAnnouncementRequest,
  MyAnnouncementResponse,
} from "@/types/announcement";

export const announcementsApi = {
  create: async (
    request: CreateAnnouncementRequest,
  ): Promise<AnnouncementManagementResponse> => {
    const response = await api.post<
      ApiResponse<AnnouncementManagementResponse>
    >("/announcements", request);
    return response.data.data;
  },

  list: async (
    page: number = 0,
    size: number = 5,
  ): Promise<PaginatedResponse<AnnouncementManagementResponse>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<AnnouncementManagementResponse>>
    >("/announcements", {
      params: { page, size },
    });
    return response.data.data;
  },

  getMy: async (
    page: number,
    size = 5,
  ): Promise<PaginatedResponse<MyAnnouncementResponse>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<MyAnnouncementResponse>>
    >("/announcements/my", { params: { page, size } });
    return response.data.data;
  },

  getMyGate: async (): Promise<PaginatedResponse<MyAnnouncementResponse>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<MyAnnouncementResponse>>
    >("/announcements/my-gate");
    return response.data.data;
  },

  getById: async (id: number): Promise<AnnouncementDetailResponse> => {
    const response = await api.get<ApiResponse<AnnouncementDetailResponse>>(
      `/announcements/${id}`,
    );
    return response.data.data;
  },

  markRead: async (id: number): Promise<void> => {
    await api.post<void>(`/announcements/${id}/read`);
  },

  archive: async (id: number): Promise<void> => {
    await api.post<ApiResponse<string>>(`/announcements/${id}/archive`);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<string>>(`/announcements/${id}`);
  },
};
