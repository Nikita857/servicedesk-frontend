// Message types based on OpenAPI spec

import type { UserShortResponse } from "./ticket";
import { SenderType } from "@/types/auth";

export interface MessageAttachment {
  id: number;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  type: "PHOTO" | "SCREENSHOT" | "VIDEO" | "DOCUMENT";
}

export interface Message {
  id: number;
  ticketId: number;
  content: string;
  sender: UserShortResponse;
  senderType: SenderType;
  internal: boolean;
  readByUser: boolean;
  readBySpecialist: boolean;
  edited: boolean;
  attachments?: MessageAttachment[];
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

// Sender type labels and colors
// Role hierarchy: USER < SYSADMIN (1 line) < DEV1C (2 line) < DEVELOPER (3 line + admin)
interface SenderTypeConfig {
  label: string;
  color: string;
  line?: number;
}

const senderTypeConfig: Record<SenderType, SenderTypeConfig> = {
  USER: { label: "Пользователь", color: "blue" },
  SYSADMIN: { label: "Сисадмин", color: "green", line: 1 },
  ONE_C_SUPPORT: { label: "1С Поддержка", color: "blue", line: 2 },
  DEV1C: { label: "Разработчик 1С", color: "orange", line: 3 },
  DEVELOPER: { label: "Разработчик", color: "purple", line: 4 },
  ADMIN: { label: "Администратор", color: "red" },
};

// Get sender config with fallback for unknown types
export const getSenderConfig = (
  senderType: SenderType | string
): SenderTypeConfig => {
  return (
    senderTypeConfig[senderType as SenderType] || {
      label: senderType,
      color: "gray",
    }
  );
};
