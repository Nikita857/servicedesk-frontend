// Notification types for WebSocket

export type NotificationType = 'MESSAGE' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'ESCALATION' | 'ESTIMATED_DATE' | 'RATING';

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
