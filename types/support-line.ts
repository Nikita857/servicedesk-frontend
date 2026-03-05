import type { AssignmentMode } from "./ticket";

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
}

export interface SupportLineDetail extends SupportLineListResponse {
  assignmentMode: AssignmentMode;
  targetRole: string;
  specialists: Specialist[];
  telegramChatId?: number | null;
}

export interface UpdateSupportLineRequest {
  description?: string;
  slaMinutes?: number;
  assignmentMode?: AssignmentMode;
  displayOrder?: number;
}
