import { CategoryResponse } from "./category";
import { SupportLineListResponse } from "./support-line";
import { TicketPriority, TicketStatus, UserShortResponse } from "./ticket";

export type ScheduledTaskStatus =
  | "SCHEDULED"
  | "EXECUTED"
  | "CANCELLED"
  | "OVERDUE"
  | "COMPLETED_LATE"
  | "IN_PROGRESS";

export type RecurrenceType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface CreateScheduledTaskRequest {
  title: string; // required, max 250
  description: string; // required
  link1c?: string; // max 1000
  categoryUserId?: number;
  priority?: TicketPriority;
  supportLineId?: number;
  assignToUserId?: number;
  scheduledAt: string; // required, ISO 8601, должно быть в будущем
  recurrenceType: RecurrenceType; // required
  recurrenceDaysOfWeek?: DayOfWeek[];
  recurrenceUntil?: string; // ISO 8601
  deadlineAt?: string; // ISO 8601
}

export interface ScheduledTaskFilter {
  status: ScheduledTaskStatus;
  from: string;
  to: string;
}

export interface UpdateScheduledTaskRequest {
  title?: string; // max 250
  description?: string;
  link1c?: string; // max 1000
  categoryUserId?: number;
  priority?: TicketPriority;
  supportLineId?: number;
  assignToUserId?: number;
  scheduledAt?: string; // ISO 8601, должно быть в будущем
  recurrenceType?: RecurrenceType;
  recurrenceDaysOfWeek?: DayOfWeek[];
  recurrenceUntil?: string; // ISO 8601
  deadlineAt?: string; // ISO 8601
}

export interface ScheduledTaskExecutionResponse {
  id: number;
  ticketId: number;
  executedAt: string; // ISO 8601
  success: boolean;
  errorMessage: string;
}

export interface ScheduledTaskListResponse {
  id: number;
  title: string;
  status: ScheduledTaskStatus;
  displayTicketStatus: TicketStatus[];
  scheduledAt: string; // ISO 8601
  nextRunAt: string; // ISO 8601
  recurrenceType: RecurrenceType;
  assignTo: UserShortResponse;
  deadlineAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export interface ScheduledTaskResponse {
  id: number;
  title: string;
  description: string;
  link1c: string;
  priority: TicketPriority;
  createdBy: UserShortResponse;
  assignTo: UserShortResponse;
  supportLine: SupportLineListResponse;
  categoryUser: CategoryResponse;
  scheduledAt: string; // ISO 8601
  nextRunAt: string; // ISO 8601
  recurrenceType: RecurrenceType;
  recurrenceDaysOfWeek: DayOfWeek[];
  recurrenceUntil: string; // ISO 8601
  status: ScheduledTaskStatus;
  displayTicketStatus: TicketStatus[];
  executionsCount: number;
  deadlineAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface ScheduledTaskOccurrenceResponse {
  taskId: number;
  title: string;
  occurrenceAt: string;
  priority: TicketPriority;
  recurrenceType: RecurrenceType;
  isVirtual: boolean;
  assignTo: UserShortResponse;
  ticketId: number | null;
  ticketStatus: TicketStatus | null;
  taskStatus: ScheduledTaskStatus;
  deadlineAt: string | null;
}

export interface DateWindow {
  from: string;
  to: string;
}

export interface ScheduledTaskDeadlineResponse {
  taskId: number;
  taskTitle: string;
  deadlineAt: string;
}

export const TASK_STATUS_CONFIG: Record<
  ScheduledTaskStatus,
  { label: string; color: string; variant: "subtle" | "solid" }
> = {
  SCHEDULED: { label: "Запланировано", color: "blue", variant: "subtle" },
  IN_PROGRESS: { label: "В работе", color: "cyan", variant: "subtle" },
  EXECUTED: { label: "Выполнено", color: "green", variant: "subtle" },
  CANCELLED: { label: "Отменено", color: "gray", variant: "subtle" },
  OVERDUE: { label: "Просрочено", color: "red", variant: "subtle" },
  COMPLETED_LATE: {
    label: "Выполнено с опозданием",
    color: "orange",
    variant: "subtle",
  },
};
