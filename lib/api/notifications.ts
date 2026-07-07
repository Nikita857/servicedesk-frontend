import api from "./client";
import {ApiResponse, NotificationResponse, PaginatedResponse} from "@/types";

export const notificationsApi = {
    list: async (page: number = 0, size: number = 5): Promise<PaginatedResponse<NotificationResponse>> => {
        const response = await api.get<ApiResponse<PaginatedResponse<NotificationResponse>>>("/notifications",
            { params: {page, size} });
        return response.data.data;
    },
    
    getUnreadCount: async (): Promise<number> => {
        const response = await api.get<ApiResponse<number>>("/notifications/unread-count");
        return response.data.data;
    },

    markAsRead: async (id: number): Promise<void> => {
        await api.patch<void>(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch<void>(`/notifications/read-all`);
    },

    clearAll: async (): Promise<void> => {
        await api.patch<void>(`/notifications/clear`);
    }
}