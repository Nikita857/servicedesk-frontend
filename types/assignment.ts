import type {
  AssignmentStatus,
  AssignmentMode,
  UserShortResponse,
} from "./ticket";

export interface SupportLineShortResponse {
  id: number;
  name: string;
}

export interface AssignmentResponse {
  id: number;
  ticketId: number;
  ticketTitle: string;
  fromLine: SupportLineShortResponse | null;
  fromUser: UserShortResponse | null;
  toLine: SupportLineShortResponse;
  toUser: UserShortResponse | null;
  note: string | null;
  mode: AssignmentMode;
  status: AssignmentStatus;
  type: "PRIMARY" | "CO_EXECUTOR";
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

export interface CreateAssignmentRequest {
  ticketId: number;
  toLineId: number;
  toUserId?: number;
  fromLineId?: number | null;
  fromUserId?: number | null;
  note: string | null;
  mode?: AssignmentMode;
}

export interface RejectAssignmentRequest {
  reason: string;
}

export interface CoExecutorResponse {
  assignmentId: number;
  userId: number;
  username: string;
  fio: string | null;
  addedById: number | null;
  addedByUsername: string | null;
  addedAt: string;
}

export interface AssignmentShortResponse {
  id: number;
  toUser: UserShortResponse;
  status: AssignmentStatus;
  createdAt: string;
  acceptedAt: string;
  mode: string;
}
