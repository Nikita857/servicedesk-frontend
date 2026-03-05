import type { AssignmentStatus, AssignmentMode } from "./ticket";

export interface AssignmentResponse {
  id: number;
  ticketId: number;
  ticketTitle: string;
  fromLineId: number | null;
  fromLineName: string | null;
  fromUserId: number | null;
  fromUsername: string | null;
  fromFio: string | null;
  toLineId: number;
  toLineName: string;
  toUserId: number | null;
  toUsername: string | null;
  toFio: string | null;
  note: string | null;
  mode: AssignmentMode;
  status: AssignmentStatus;
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
  note: string;
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
