import type { PaginatedResponse } from "@/types/api";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
import type {
  AnnouncementDetailResponse,
  AnnouncementManagementResponse,
  CreateAnnouncementRequest,
  MyAnnouncementResponse,
} from "@/types/announcement";

const generated = getServiceDeskAPI();

export const announcementsApi = {
  create: async (
    request: CreateAnnouncementRequest,
  ): Promise<AnnouncementManagementResponse> => {
    return (await generated.createAnnouncement(request)).data as AnnouncementManagementResponse;
  },

  list: async (
    page: number = 0,
    size: number = 5,
  ): Promise<PaginatedResponse<AnnouncementManagementResponse>> => {
    return toPage((await generated.getAnnouncements({ pageable: { page, size } })).data) as PaginatedResponse<AnnouncementManagementResponse>;
  },

  getMy: async (
    page: number,
    size = 5,
  ): Promise<PaginatedResponse<MyAnnouncementResponse>> => {
    return toPage((await generated.getMyAnnouncementsPageable({ pageable: { page, size } })).data) as PaginatedResponse<MyAnnouncementResponse>;
  },

  getMyGate: async (): Promise<PaginatedResponse<MyAnnouncementResponse>> => {
    return toPage((await generated.getMyAnnouncementsGate({ pageable: { page: 0, size: 5 } })).data) as PaginatedResponse<MyAnnouncementResponse>;
  },

  getById: async (id: number): Promise<AnnouncementDetailResponse> => {
    return (await generated.getAnnouncement(id)).data as AnnouncementDetailResponse;
  },

  markRead: async (id: number): Promise<void> => {
    await generated.readAnnouncement(id);
  },

  archive: async (id: number): Promise<void> => {
    await generated.archiveAnnouncement(id);
  },

  remove: async (id: number): Promise<void> => {
    await generated.deleteAnnouncement(id);
  },
};
