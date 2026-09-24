import type { NotificationResponse, PaginatedResponse } from "@/types";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';

const generated = getServiceDeskAPI();

export const notificationsApi = {
    list: async (page: number = 0, size: number = 5): Promise<PaginatedResponse<NotificationResponse>> => {
        return toPage((await generated.getNotifications({ pageable: { page, size } })).data) as PaginatedResponse<NotificationResponse>;
    },
    
    getUnreadCount: async (): Promise<number> => {
        return (await generated.getUnreadCount1()).data as number;
    },

    markAsRead: async (id: number): Promise<void> => {
        await generated.markAsRead2(id);
    },

    markAllAsRead: async (): Promise<void> => {
        await generated.markAllAsRead();
    },

    clearAll: async (): Promise<void> => {
        await generated.clear();
    }
}
