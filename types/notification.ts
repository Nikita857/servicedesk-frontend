// Notification types for WebSocket

export type NotificationType =
    'MESSAGE' |
    'STATUS_CHANGE' |
    'ASSIGNMENT' |
    'ESTIMATED_DATE' |
    'RATING' |
    'ASSIGNMENT_REJECTED'|
    'ASSIGNMENT_ACCEPTED'|
    'CO_EXECUTOR_ADDED' |
    'CO_EXECUTOR_REMOVED';

export interface Notification {
  type: NotificationType;
  ticketId: number;
  ticketTitle: string;
  title: string;
  body: string;
  senderId: number | null;
  senderName: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  ticketId: number;
  ticketTitle: string;
  title: string | null;
  body: string | null;
  senderId: number | null;
  senderName: string | null;
  messageCount: number;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
