// Notification types — должны совпадать с ru.bormash.servicedesk.feature.notification.model.NotificationType
export type NotificationType =
  | "MESSAGE"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "ASSIGNMENT_ACCEPTED"
  | "ASSIGNMENT_REJECTED"
  | "ASSIGNMENT_CANCELLED"
  | "CO_EXECUTOR_ADDED"
  | "CO_EXECUTOR_REMOVED"
  | "ESTIMATED_DATE"
  | "RATING"
  | "TICKET_CREATED"
  | "TICKET_TAKEN"
  | "SPECIALIST_ADDED_TO_LINE"
  | "SPECIALIST_REMOVED_FROM_LINE";

export interface Notification {
  type: NotificationType;
  ticketId: number | null;
  ticketTitle: string | null;
  title: string;
  body: string;
  senderId: number | null;
  senderName: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  ticketId: number | null;
  ticketTitle: string | null;
  title: string | null;
  body: string | null;
  senderId: number | null;
  senderName: string | null;
  messageCount: number;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettingResponse {
  type: NotificationType;
  inAppEnabled: boolean;
  telegramEnabled: boolean;
  vkEnabled: boolean;
  maxEnabled: boolean;
}

export interface NotificationSettingUpdateRequest {
  type: NotificationType;
  inAppEnabled: boolean;
  telegramEnabled: boolean;
  vkEnabled: boolean;
  maxEnabled: boolean;
}

export interface NotificationSettingsBulkUpdate {
  settings: NotificationSettingUpdateRequest[];
}
