import {
  CreateScheduledTaskRequest,
  DateWindow,
  ScheduledTaskDeadlineResponse,
  ScheduledTaskExecutionResponse,
  ScheduledTaskFilter,
  ScheduledTaskListResponse,
  ScheduledTaskOccurrenceResponse,
  ScheduledTaskResponse,
  UpdateScheduledTaskRequest,
} from "@/types/scheduler";
import api from "./client";
import { PaginatedResponse } from "@/types";

export const scheduledTasksApi = {
  list: async (
    filter: Partial<ScheduledTaskFilter>,
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<ScheduledTaskListResponse>> => {
    const response = await api.get(`/scheduled-tasks`, {
      params: { ...filter, page, size },
    });
    return response.data;
  },

  getById: async (id: number): Promise<ScheduledTaskResponse> => {
    const response = await api.get(`/scheduled-tasks/${id}`);
    return response.data.data;
  },

  create: async (
    request: CreateScheduledTaskRequest,
  ): Promise<ScheduledTaskResponse> => {
    const response = await api.post(`/scheduled-tasks`, request);
    return response.data.data;
  },

  update: async (
    id: number,
    body: UpdateScheduledTaskRequest,
  ): Promise<ScheduledTaskResponse> => {
    const response = await api.put(`/scheduled-tasks/${id}`, body);
    return response.data.data;
  },

  cancel: async (id: number): Promise<void> => {
    await api.delete(`/scheduled-tasks/${id}`);
  },

  getCalendar: async (
    window: DateWindow,
  ): Promise<ScheduledTaskOccurrenceResponse[]> => {
    const response = await api.get(`/scheduled-tasks/calendar`, {
      params: { from: window.from, to: window.to },
    });
    return response.data.data;
  },

  getExecutions: async (
    id: number,
    page = 0,
    size = 20,
  ): Promise<ScheduledTaskExecutionResponse[]> => {
    const response = await api.get(`/scheduled-tasks/${id}/executions`, {
      params: { page, size },
    });
    return response.data.data;
  },

  getByTicket: async (
    ticketId: number,
  ): Promise<ScheduledTaskDeadlineResponse | null> => {
    const response = await api.get(`/scheduled-tasks/by-ticket/${ticketId}`);
    return response.data.data;
  },
};
