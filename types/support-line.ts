import type { AssignmentMode } from "./ticket";

export interface SpecialistTypeResponse {
  id: number;
  code: string;
  name: string;
  color: string;
  displayOrder: number;
  active: boolean;
  system: boolean;
}

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
  specialistType?: SpecialistTypeResponse | null;
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
  specialistType: SpecialistTypeResponse | null;
  specialistIds: number[];
}

export interface SupportLineDetail extends SupportLineListResponse {
  assignmentMode: AssignmentMode;
  specialists: Specialist[];
  supportLineChatsResponse: SupportLineChatsResponse;
}

export interface CreateSupportLineRequest {
  name: string;
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  specialistTypeId: number;
  displayOrder?: number;
}

export interface UpdateSupportLineRequest {
  name?: string;
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  specialistTypeId?: number;
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
