/**
 * Централизованные типы для WebSocket коммуникации
 * Используются в WebSocketProvider и всех WebSocket хуках
 */

import { UserShort } from "./ticket";

// ==================== Chat Types ====================

/**
 * Сообщение чата, полученное через WebSocket
 */
export interface ChatMessageWS {
  id: number;
  ticketId: number;
  content: string;
  sender?: UserShort;
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
  type: 'PHOTO' | 'SCREENSHOT' | 'VIDEO' | 'DOCUMENT';
  ticketId: number;
  messageId: number | null;
  uploadedById: number;
  uploadedByUsername: string;
  createdAt: string;
}

// ==================== Ticket Types ====================

/**
 * Payload обновления тикета через WebSocket
 */
export interface TicketUpdatePayload {
  ticketId: number;
  eventType:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'taken'
    | 'assigned'
    | 'status_changed';
}

// ==================== Callback Types ====================

/**
 * Коллбеки для подписки на события чата тикета
 */
export interface ChatWebSocketCallbacks {
  onMessage?: (message: ChatMessageWS) => void;
  onTyping?: (indicator: TypingIndicator) => void;
  onAttachment?: (attachment: AttachmentWS) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}
