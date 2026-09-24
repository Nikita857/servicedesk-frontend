import type {
  NotificationResponse as WireNotification,
  NotificationResponseType,
  NotificationSettingResponse as WireSetting,
} from '@/lib/api/generated/models';

export type NotificationType = NotificationResponseType;

// UI live-notification state is distinct from the paged REST response.
export interface Notification {
  type: NotificationType;
  ticketId: number | null;
  ticketTitle: string | null;
  surveyId: number | null;
  surveyTitle: string | null;
  announcementId: number | null;
  announcementTitle: string | null;
  title: string;
  body: string;
  senderId: number | null;
  senderName: string | null;
  createdAt: string;
}

export type NotificationResponse = Omit<Required<WireNotification>,
  'ticketId' | 'ticketTitle' | 'surveyId' | 'surveyTitle' |
  'announcementId' | 'announcementTitle' | 'title' | 'body' | 'senderId' | 'senderName'> & {
  ticketId: number | null;
  ticketTitle: string | null;
  surveyId: number | null;
  surveyTitle: string | null;
  announcementId: number | null;
  announcementTitle: string | null;
  title: string | null;
  body: string | null;
  senderId: number | null;
  senderName: string | null;
};
export type NotificationSettingResponse = Required<WireSetting>;
export type { NotificationSettingUpdateRequest, NotificationSettingsBulkUpdate } from '@/lib/api/generated/models';
