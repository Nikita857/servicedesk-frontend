import api from './client';
import type { ApiResponse } from '@/types/api';

/**
 * Reports API
 * Эндпоинты для отчётов и статистики (только для ADMIN)
 */

// ==================== Response Types ====================

export interface TimeReportBySpecialist {
  specialistId: number;
  username: string;
  fio: string;
  totalSeconds: number;
  ticketCount: number;
  formattedTime: string;
}

export interface TimeReportByLine {
  lineId: number;
  lineName: string;
  lineLevel: number;
  totalSeconds: number;
  ticketCount: number;
  specialistCount: number;
  formattedTime: string;
}

export interface TicketStatusHistory {
  id: number;
  status: string;
  enteredAt: string;
  exitedAt: string | null;
  durationSeconds: number;
  durationFormatted: string;
  changedByUsername: string;
  changedByFio: string;
  comment: string | null;
}

export interface TicketHistory {
  ticketId: number;
  title: string;
  status: string;
  priority: string;
  createdByFio: string;
  assignedToFio: string | null;
  supportLine: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  deletedAt: string | null;
  firstResponseTimeSeconds: number;
  totalUnassignedSeconds: number;
  totalActiveSeconds: number;
  statusHistory: TicketStatusHistory[];
}

export interface ReassignmentHistory {
  assignmentId: number;
  fromUserFio: string | null;
  toUserFio: string | null;
  fromLine: string | null;
  toLine: string | null;
  mode: string;
  status: string;
  note: string | null;
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

export interface ResolutionTimeStats {
  totalResolved: number;
  avgResolutionSeconds: number;
  minResolutionSeconds: number;
  maxResolutionSeconds: number;
  medianResolutionSeconds: number;
  formattedAvgTime: string;
}

export interface TicketStatsByCategory {
  categoryId: number | null;
  categoryName: string | null;
  categoryType: string | null;
  count: number;
  percentage: number;
}

export interface TicketStatsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TicketReportItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdByFio: string;
  assignedToFio: string | null;
  supportLineName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  deletedAt: string | null;
}

export interface PagedTicketReport {
  content: TicketReportItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface SpecialistWorkload {
  specialistId: number;
  username: string;
  fio: string;
  activeTickets: number;
  resolvedToday: number;
  totalTimeToday: number;
  avgResolutionTime: number;
  formattedTimeToday: string;
}

// ==================== API Methods ====================

export const reportsApi = {
  /**
   * Отчёт по времени по специалистам
   */
  getTimeBySpecialist: async (from: string, to: string): Promise<TimeReportBySpecialist[]> => {
    const response = await api.get<ApiResponse<TimeReportBySpecialist[]>>(
      '/reports/time/by-specialist',
      { params: { from, to } }
    );
    return response.data.data;
  },

  /**
   * Отчёт по времени по линиям поддержки
   */
  getTimeByLine: async (from: string, to: string): Promise<TimeReportByLine[]> => {
    const response = await api.get<ApiResponse<TimeReportByLine[]>>(
      '/reports/time/by-line',
      { params: { from, to } }
    );
    return response.data.data;
  },

  /**
   * История тикета с временной статистикой
   */
  getTicketHistory: async (ticketId: number): Promise<TicketHistory> => {
    const response = await api.get<ApiResponse<TicketHistory>>(
      `/reports/tickets/${ticketId}/history`
    );
    return response.data.data;
  },

  /**
   * История переназначений тикета
   */
  getReassignmentHistory: async (ticketId: number): Promise<ReassignmentHistory[]> => {
    const response = await api.get<ApiResponse<ReassignmentHistory[]>>(
      `/reports/tickets/${ticketId}/assignments`
    );
    return response.data.data;
  },

  /**
   * Статистика времени решения тикетов
   */
  getResolutionTimeStats: async (): Promise<ResolutionTimeStats> => {
    const response = await api.get<ApiResponse<ResolutionTimeStats>>(
      '/reports/tickets/resolution-time'
    );
    return response.data.data;
  },

  /**
   * Статистика по пользовательским категориям
   */
  getStatsByUserCategory: async (): Promise<TicketStatsByCategory[]> => {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      '/reports/tickets/by-user-category'
    );
    return response.data.data;
  },

  /**
   * Статистика по категориям поддержки
   */
  getStatsBySupportCategory: async (): Promise<TicketStatsByCategory[]> => {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      '/reports/tickets/by-support-category'
    );
    return response.data.data;
  },

  /**
   * Статистика по статусам
   */
  getStatsByStatus: async (): Promise<TicketStatsByStatus[]> => {
    const response = await api.get<ApiResponse<TicketStatsByStatus[]>>(
      '/reports/tickets/by-status'
    );
    return response.data.data;
  },

  /**
   * Все тикеты (включая удалённые) — пагинация
   */
  getAllTickets: async (page = 0, size = 20): Promise<PagedTicketReport> => {
    const response = await api.get<ApiResponse<PagedTicketReport>>(
      '/reports/tickets/all',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * Загрузка специалистов
   */
  getSpecialistWorkload: async (): Promise<SpecialistWorkload[]> => {
    const response = await api.get<ApiResponse<SpecialistWorkload[]>>(
      '/reports/specialists/workload'
    );
    return response.data.data;
  },
};
