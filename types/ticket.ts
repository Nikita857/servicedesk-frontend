// Ticket types based on OpenAPI spec

import { Page } from "./api";
import type { CategoryResponse } from "./category";
import type { SupportLineListResponse } from "./support-line";
import type { AssignmentResponse, CoExecutorResponse } from "./assignment";

export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "PENDING"
  | "ESCALATED"
  | "RESOLVED"
  | "PENDING_CLOSURE"
  | "CLOSED"
  | "REOPENED"
  | "REJECTED"
  | "CANCELLED";

export const TicketStatusCollection: Record<string, TicketStatus[]> = {
  new: ["NEW"],
  open: ["OPEN", "PENDING", "REOPENED", "RESOLVED", "ESCALATED"],
  closed: ["CLOSED", "PENDING_CLOSURE"],
  rejected: ["REJECTED"],
}

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface UserShortResponse {
  id: number;
  username: string;
  fio: string | null;
  avatarUrl: string | null;
  isSpecialist: boolean;
}

// List item (for tables)
export interface TicketListResponse {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdByUsername: string;
  assignedToUsername: string | null;
  supportLineName: string | null;
  createdAt: string;
  slaDeadline: string | null;
}

// Full ticket response
export interface Ticket {
  id: number;
  title: string;
  description: string;
  link1c: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: UserShortResponse;
  assignedTo: UserShortResponse | null;
  supportLine: SupportLineListResponse | null;
  categoryUser: CategoryResponse | null;
  categorySupport: CategoryResponse | null;
  timeSpentSeconds: number;
  messageCount: number;
  attachmentCount: number;
  slaDeadline: string | null;
  estimatedCompletionDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastAssignment: AssignmentResponse | null;
  coExecutors: CoExecutorResponse[];
}

// Request DTOs
export interface CreateTicketRequest {
  title: string;
  description: string;
  link1c?: string;
  categoryUserId?: number;
  priority?: TicketPriority;
  supportLineId?: number;
  assignToUserId?: number; // Прямое назначение специалисту
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  link1c?: string;
  priority?: TicketPriority;
}

export interface ChangeStatusRequest {
  status: TicketStatus;
  comment?: string;
}

// Paginated response
export interface PagedTicketList {
  content: TicketListResponse[];
  page: Page
}

// Status labels and colors
interface StatusConfig {
  label: string;
  color: string;
}

export const ticketStatusConfig: Record<TicketStatus, StatusConfig> = {
  NEW: { label: "Новый", color: "blue" },
  OPEN: { label: "В работе", color: "green" },
  PENDING: { label: "Ожидание", color: "yellow" },
  ESCALATED: { label: "Эскалирован", color: "orange" },
  RESOLVED: { label: "Решён", color: "teal" },
  PENDING_CLOSURE: { label: "Ожидает закрытия", color: "cyan" },
  CLOSED: { label: "Закрыт", color: "gray" },
  REOPENED: { label: "Переоткрыт", color: "purple" },
  REJECTED: { label: "Отклонён", color: "red" },
  CANCELLED: { label: "Отменён", color: "gray" },
};

// Assignment Status configuration
export type AssignmentStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export const assignmentStatusConfig: Record<AssignmentStatus, StatusConfig> = {
  PENDING: { label: "Ожидает", color: "yellow" },
  ACCEPTED: { label: "Принято", color: "green" },
  REJECTED: { label: "Отклонено", color: "red" },
  CANCELLED: {label: "Аннулировано", color: "gray" },
};

// Assignment Mode configuration
export type AssignmentMode =
  | "FIRST_AVAILABLE"
  | "ROUND_ROBIN"
  | "LEAST_LOADED"
  | "DIRECT";

export const assignmentModeConfig: Record<AssignmentMode, string> = {
  FIRST_AVAILABLE: "Первый свободный",
  ROUND_ROBIN: "По очереди",
  LEAST_LOADED: "Наименее загружен",
  DIRECT: "Напрямую",
};

export const ticketPriorityConfig: Record<
  TicketPriority,
  { label: string; color: string }
> = {
  LOW: { label: "Низкий", color: "gray" },
  MEDIUM: { label: "Средний", color: "blue" },
  HIGH: { label: "Высокий", color: "orange" },
  URGENT: { label: "Срочный", color: "red" },
};

// Status transition rules - which statuses can transition to which (FULL - for admin)
export const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: ["OPEN", "REJECTED", "CANCELLED"],
  OPEN: ["PENDING", "RESOLVED", "ESCALATED", "CLOSED"],
  PENDING: ["OPEN", "CLOSED"],
  ESCALATED: ["OPEN", "PENDING", "RESOLVED", "CLOSED"],
  RESOLVED: ["PENDING_CLOSURE", "REOPENED", "CLOSED"],
  PENDING_CLOSURE: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "RESOLVED", "PENDING", "ESCALATED", "CANCELLED", "CLOSED"],
  REJECTED: [],
  CANCELLED: [],
};

// Specialist-allowed transitions (specialists except admin) - NO CANCELLED
// Specialists should use cancel button instead
export const specialistStatusTransitions: Record<TicketStatus, TicketStatus[]> =
  {
    NEW: ["OPEN", "REJECTED"],
    OPEN: ["PENDING", "RESOLVED", "ESCALATED"],
    PENDING: ["OPEN"],
    ESCALATED: ["OPEN", "PENDING", "RESOLVED"],
    RESOLVED: ["PENDING_CLOSURE", "REOPENED"],
    PENDING_CLOSURE: ["CLOSED", "REOPENED"],
    CLOSED: ["REOPENED"],
    REOPENED: ["OPEN", "RESOLVED", "PENDING", "ESCALATED"],
    REJECTED: [],
    CANCELLED: [],
  };
// User (ticket creator) transitions — only actions meaningful for the author
export const userStatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  NEW: [],
  OPEN: [],
  PENDING: [],
  ESCALATED: [],
  RESOLVED: ["REOPENED"],
  PENDING_CLOSURE: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: [],
  REJECTED: [],
  CANCELLED: [],
};

// Status history entry
export interface TicketStatusHistory {
  id: number;
  status: string;
  enteredAt: string;
  exitedAt: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  changedByUsername: string | null;
  changedByFio: string | null;
  comment: string | null;
}

export interface RateTicketRequest {
  rating: number;
  feedback?: string;
}
