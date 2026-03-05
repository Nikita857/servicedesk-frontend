import api from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  TimeReportBySpecialist,
  TimeReportByLine,
  TicketHistory,
  ReassignmentHistory,
  ResolutionTimeStats,
  TicketStatsByCategory,
  TicketStatsByStatus,
  TicketReportItem,
  PagedTicketReport,
  SpecialistWorkload,
} from "@/types/stats";

/**
 * Reports API
 * Эндпоинты для отчётов и статистики (только для ADMIN)
 */

// ==================== API Methods ====================

export const reportsApi = {
  /**
   * Отчёт по времени по специалистам
   */
  getTimeBySpecialist: async (
    from: string,
    to: string
  ): Promise<TimeReportBySpecialist[]> => {
    const response = await api.get<ApiResponse<TimeReportBySpecialist[]>>(
      "/reports/time/by-specialist",
      { params: { from, to } }
    );
    return response.data.data;
  },

  /**
   * Отчёт по времени по линиям поддержки
   */
  getTimeByLine: async (
    from: string,
    to: string
  ): Promise<TimeReportByLine[]> => {
    const response = await api.get<ApiResponse<TimeReportByLine[]>>(
      "/reports/time/by-line",
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
  getReassignmentHistory: async (
    ticketId: number
  ): Promise<ReassignmentHistory[]> => {
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
      "/reports/tickets/resolution-time"
    );
    return response.data.data;
  },

  /**
   * Статистика по пользовательским категориям
   */
  getStatsByUserCategory: async (): Promise<TicketStatsByCategory[]> => {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      "/reports/tickets/by-user-category"
    );
    return response.data.data;
  },

  /**
   * Статистика по категориям поддержки
   */
  getStatsBySupportCategory: async (): Promise<TicketStatsByCategory[]> => {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      "/reports/tickets/by-support-category"
    );
    return response.data.data;
  },

  /**
   * Статистика по статусам
   */
  getStatsByStatus: async (): Promise<TicketStatsByStatus[]> => {
    const response = await api.get<ApiResponse<TicketStatsByStatus[]>>(
      "/reports/tickets/by-status"
    );
    return response.data.data;
  },

  /**
   * Все тикеты (включая удалённые) — пагинация
   */
  getAllTickets: async (page = 0, size = 20): Promise<PagedTicketReport> => {
    const response = await api.get<ApiResponse<PagedTicketReport>>(
      "/reports/tickets/all",
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * Загрузка специалистов
   */
  getSpecialistWorkload: async (): Promise<SpecialistWorkload[]> => {
    const response = await api.get<ApiResponse<SpecialistWorkload[]>>(
      "/reports/specialists/workload"
    );
    return response.data.data;
  },
};

export type {
  TimeReportBySpecialist,
  TimeReportByLine,
  TicketHistory,
  ReassignmentHistory,
  ResolutionTimeStats,
  TicketStatsByCategory,
  TicketStatsByStatus,
  PagedTicketReport,
  SpecialistWorkload,
};
