import type { NotificationSettingResponse, NotificationSettingsBulkUpdate } from '@/types/notification';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const notificationSettingsApi = {
  get: async (): Promise<NotificationSettingResponse[]> => (await generated.getSettings()).data as NotificationSettingResponse[],
  update: async (data: NotificationSettingsBulkUpdate): Promise<NotificationSettingResponse[]> =>
    (await generated.updateSettings(data)).data as NotificationSettingResponse[],
};
