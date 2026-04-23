/**
 * Централизованные типы для WebSocket коммуникации
 * Используются в WebSocketProvider и всех WebSocket хуках
 */

import type {
  AssignmentMode,
  AssignmentStatus,
  TicketStatus,
  UserShortResponse,
} from "./ticket";

export type TicketEventType =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_REJECTED"
  | "MESSAGE_SENT"
  | "MESSAGE_UPDATED"
  | "RATED"
  | "DELETED"
  | "ATTACHMENT_ADDED"
  | "INTERNAL_COMMENT"
  | "ESTIMATED_DATE_SET";

export interface TicketListEventWS {
  id: number;
  eventType: TicketEventType;
  status: TicketStatus | null; // null для DELETED
  assigneeId: number | null;
  supportLineId: number | null;
  timestamp: string; // ISO
}

// ==================== Chat Types ====================

/**
 * Сообщение чата, полученное через WebSocket
 */
export interface ChatMessageWS {
  id: number;
  ticketId: number;
  content: string;
  sender?: UserShortResponse;
  senderId?: number;
  senderUsername?: string;
  senderFio?: string | null;
  senderType: string;
  internal: boolean;
  createdAt: string;
  attachments?: AttachmentWS[]; // Support for attachments in message payload
}

/**
 * Индикатор набора текста
 */
export interface TypingIndicator {
  ticketId: number;
  userId: number;
  username: string;
  fio: string | null;
  typing: boolean;
}

/**
 * Вложение, полученное через WebSocket
 */
export interface AttachmentWS {
  id: number;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  type: "PHOTO" | "SCREENSHOT" | "VIDEO" | "DOCUMENT";
  ticketId: number;
  messageId: number | null;
  uploadedById: number;
  uploadedByUsername: string;
  createdAt: string;
}

/**
 * Уведомление о прочтении сообщений
 */
export interface ReadReceiptWS {
  ticketId: number;
  userId: number;
  username: string;
  specialist: boolean;
  readAt: string;
}

// ==================== Assignment Types ====================

/**
 * Назначение, полученное через WebSocket
 * Соответствует AssignmentResponse с бэкенда
 */
export interface AssignmentWS {
  id: number;
  ticketId: number;
  ticketTitle: string;
  fromLine?: {
    id: number;
    name: string;
  } | null;
  toLine: {
    id: number;
    name: string;
  };
  fromUser?: {
    id: number;
    username: string;
    fio: string | null;
  } | null;
  toUser?: {
    id: number;
    username: string;
    fio: string | null;
  } | null;
  mode: AssignmentMode;
  status: AssignmentStatus;
  note: string | null;
  createdAt: string;
}

// ==================== Status Types ====================

/**
 * Информация об изменении статуса пользователя через WebSocket
 */
export interface UserStatusWS {
  userId: number;
  username: string;
  fio: string;
  status: string;
  oldStatus: string;
  lineIds: number[];
}
