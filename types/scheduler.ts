import type {
  CreateScheduledTaskRequestRecurrenceDaysOfWeekItem,
  CreateScheduledTaskRequestRecurrenceType,
  GetCalendarParams,
  ScheduledTaskDeadlineResponse as WireDeadline,
  ScheduledTaskExecutionResponse as WireExecution,
  ScheduledTaskFilter as WireFilter,
  ScheduledTaskListResponse as WireList,
  ScheduledTaskOccurrenceResponse as WireOccurrence,
  ScheduledTaskResponse as WireTask,
  ScheduledTaskResponseStatus,
} from '@/lib/api/generated/models';

export type ScheduledTaskStatus = ScheduledTaskResponseStatus;
export type RecurrenceType = CreateScheduledTaskRequestRecurrenceType;
export type DayOfWeek = CreateScheduledTaskRequestRecurrenceDaysOfWeekItem;
export type { CreateScheduledTaskRequest, UpdateScheduledTaskRequest, SetOccurrenceDeadlineRequest } from '@/lib/api/generated/models';
export type ScheduledTaskFilter = WireFilter;
export type DateWindow = GetCalendarParams;

export type ScheduledTaskExecutionResponse = Omit<Required<WireExecution>, 'ticketId' | 'errorMessage'> & {
  ticketId: number | null;
  errorMessage: string | null;
};
export type ScheduledTaskListResponse = Omit<Required<WireList>,
  'nextRunAt' | 'assignTo' | 'deadlineAt' | 'deadlineOffsetMinutes'> & {
  nextRunAt: string | null;
  assignTo: NonNullable<WireList['assignTo']> | null;
  deadlineAt: string | null;
  deadlineOffsetMinutes: number | null;
};
export type ScheduledTaskResponse = Omit<Required<WireTask>,
  'link1c' | 'priority' | 'assignTo' | 'supportLine' | 'categoryUser' | 'nextRunAt' | 'recurrenceUntil' | 'deadlineOffsetMinutes' | 'deadlineAt'> & {
  link1c: string | null;
  priority: NonNullable<WireTask['priority']> | null;
  assignTo: NonNullable<WireTask['assignTo']> | null;
  supportLine: NonNullable<WireTask['supportLine']> | null;
  categoryUser: NonNullable<WireTask['categoryUser']> | null;
  nextRunAt: string | null;
  recurrenceUntil: string | null;
  deadlineOffsetMinutes: number | null;
  deadlineAt: string | null;
};
export type ScheduledTaskOccurrenceResponse = Omit<Required<WireOccurrence>,
  'ticketId' | 'ticketStatus' | 'deadlineAt'> & {
  ticketId: number | null;
  ticketStatus: NonNullable<WireOccurrence['ticketStatus']> | null;
  deadlineAt: string | null;
};
export type ScheduledTaskDeadlineResponse = Required<WireDeadline>;

export const TASK_STATUS_CONFIG: Record<
  ScheduledTaskStatus,
  { label: string; color: string; variant: "subtle" | "solid" }
> = {
  SCHEDULED: { label: "Запланировано", color: "blue", variant: "subtle" },
  IN_PROGRESS: { label: "Тикет создан", color: "cyan", variant: "subtle" },
  EXECUTED: { label: "Выполнено", color: "green", variant: "subtle" },
  CANCELLED: { label: "Отменено", color: "gray", variant: "subtle" },
  OVERDUE: { label: "Просрочено", color: "red", variant: "subtle" },
  COMPLETED_LATE: { label: "Выполнено с опозданием", color: "orange", variant: "subtle" },
};
