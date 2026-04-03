import type { AssignmentMode } from "./ticket";
import type { SenderType } from "./auth";

export type ActivityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "BUSY"
  | "TECHNICAL_ISSUE"
  | "OFFLINE";

export interface Specialist {
  id: number;
  username: string;
  fio: string | null;
  active: boolean;
  roles: string[];
  activityStatus?: ActivityStatus;
  availableForAssignment?: boolean;
}

export interface SupportLineListResponse {
  id: number;
  name: string;
  description: string | null;
  slaMinutes: number;
  specialistCount: number;
  displayOrder: number;
  role: SenderType | null;
  specialistIds: number[];
}

export interface SupportLineDetail extends SupportLineListResponse {
  assignmentMode: AssignmentMode;
  specialists: Specialist[];
  supportLineChatsResponse: SupportLineChatsResponse
}

export interface CreateSupportLineRequest {
  name: string;
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  role: SenderType;
  displayOrder?: number;
}

export interface UpdateSupportLineRequest {
  name?: string;
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  role?: SenderType;
  displayOrder?: number;
}

export interface UpdateSupportLineChatId {
  telegramChatId: number | null;
  vkChatId: number | null;
  maxChatId: number | null;
}

export interface SupportLineChatsResponse {
  telegramChatId: number | null;
  vkChatId: number | null;
  maxChatId: number | null;
}
