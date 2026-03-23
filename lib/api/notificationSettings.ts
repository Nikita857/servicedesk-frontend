import api from "./client"
import {ApiResponse, NotificationSettingResponse, NotificationSettingsBulkUpdate} from "@/types";

export const notificationSettingsApi = {
    get: async (): Promise<NotificationSettingResponse[]> => {
        const response = await api.get<ApiResponse<NotificationSettingResponse[]>>(
            "/notification/settings"
        );
        return response.data.data;
    },
    update: async (data: NotificationSettingsBulkUpdate): Promise<NotificationSettingResponse[]> => {
        const response = await api.put<ApiResponse<NotificationSettingResponse[]>>(
            "/notification/settings",
            data
        );
        return response.data.data;
    }
}