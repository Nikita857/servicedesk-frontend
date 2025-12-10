// Notification types for WebSocket

export type NotificationType = 'MESSAGE' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'ESCALATION';

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

export const notificationTypeConfig: Record<NotificationType, { icon: string; color: string }> = {
  MESSAGE: { icon: '💬', color: 'blue' },
  STATUS_CHANGE: { icon: '🔄', color: 'orange' },
  ASSIGNMENT: { icon: '👤', color: 'green' },
  ESCALATION: { icon: '⬆️', color: 'red' },
};
