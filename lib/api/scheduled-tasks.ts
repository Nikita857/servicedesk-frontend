import {
  CreateScheduledTaskRequest,
  DateWindow,
  ScheduledTaskDeadlineResponse,
  ScheduledTaskExecutionResponse,
  ScheduledTaskFilter,
  ScheduledTaskListResponse,
  ScheduledTaskOccurrenceResponse,
  ScheduledTaskResponse,
  SetOccurrenceDeadlineRequest,
  UpdateScheduledTaskRequest,
} from "@/types/scheduler";
import { getServiceDeskAPI } from './generated/client';
import { PaginatedResponse } from "@/types";

const generated = getServiceDeskAPI();

export const scheduledTasksApi = {
  list: async (
    filter: Partial<ScheduledTaskFilter>,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<ScheduledTaskListResponse>> => {
    return await generated.getTasks({ filter, pageable: { page, size } }) as PaginatedResponse<ScheduledTaskListResponse>;
  },

  getById: async (id: number): Promise<ScheduledTaskResponse> => {
    return (await generated.getTask(id)).data as ScheduledTaskResponse;
  },

  create: async (
    request: CreateScheduledTaskRequest,
  ): Promise<ScheduledTaskResponse> => {
    return (await generated.createTask(request)).data as ScheduledTaskResponse;
  },

  update: async (
    id: number,
    body: UpdateScheduledTaskRequest,
  ): Promise<ScheduledTaskResponse> => {
    return (await generated.updateTask(id, body)).data as ScheduledTaskResponse;
  },

  cancel: async (id: number): Promise<void> => {
    await generated.cancelTask(id);
  },

  getCalendar: async (
    window: DateWindow,
  ): Promise<ScheduledTaskOccurrenceResponse[]> => {
    return (await generated.getCalendar(window)).data as ScheduledTaskOccurrenceResponse[];
  },

  getExecutions: async (
    id: number,
    page = 0,
    size = 20,
  ): Promise<ScheduledTaskExecutionResponse[]> => {
    return (await generated.getTaskExecutions(id, { pageable: { page, size } })).data as ScheduledTaskExecutionResponse[];
  },

  getByTicket: async (
    ticketId: number,
  ): Promise<ScheduledTaskDeadlineResponse | null> => {
    return (await generated.getByTicket(ticketId)).data as ScheduledTaskDeadlineResponse | null;
  },
  setOccurrenceDeadline: async (
    id: number,
    body: SetOccurrenceDeadlineRequest,
  ): Promise<void> => {
    await generated.setOccurrenceDeadline(id, body);
  },

  clearOccurrenceDeadline: async (
    id: number,
    occurrenceAt: string,
  ): Promise<void> => {
    await generated.clearOccurrenceDeadline(id, { occurrenceAt });
  },
};
