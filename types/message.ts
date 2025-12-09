// Message types based on OpenAPI spec

import type { UserShort } from './ticket';

export type SenderType = 'USER' | 'SPECIALIST' | 'DEVELOPER' | 'ADMIN' | 'SYSTEM';

export interface Message {
  id: number;
  ticketId: number;
  content: string;
  sender: UserShort;
  senderType: SenderType;
  internal: boolean;
  readByUser: boolean;
  readBySpecialist: boolean;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
  internal?: boolean;
}

export interface EditMessageRequest {
  content: string;
}

export interface PagedMessages {
  content: Message[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Sender type labels
export const senderTypeConfig: Record<SenderType, { label: string; color: string }> = {
  USER: { label: 'Пользователь', color: 'blue' },
  SPECIALIST: { label: 'Специалист', color: 'green' },
  DEVELOPER: { label: 'Разработчик', color: 'purple' },
  ADMIN: { label: 'Админ', color: 'red' },
  SYSTEM: { label: 'Система', color: 'gray' },
};
