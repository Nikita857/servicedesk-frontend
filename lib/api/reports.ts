import { type PaginatedResponse } from "@/types/api";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
import type { TicketFilter } from './generated/models';
import type {
  TimeReportBySpecialist,
  TimeReportByLine,
  TicketHistory,
  ReassignmentHistory,
  ResolutionTimeStats,
  TicketStatsByCategory,
  TicketStatsByStatus,
  SpecialistWorkload,
  TicketReportListResponse,
} from "@/types/stats";

/**
 * Фильтр отчёта «Все заявки» (включая удалённые).
 * Поля соответствуют backend `TicketFilter` (@ModelAttribute).
 */
export type AllTicketsFilter = TicketFilter;

const generated = getServiceDeskAPI();
const legacyReportUnavailable = (): never => {
  throw new Error('This legacy report is unavailable: no backend operation exists');
};

/**
 * Reports API
 * Эндпоинты для отчётов и статистики (только для ADMIN)
 */

// ==================== API Methods ====================

export const reportsApi = {
  /**
   * Отчёт по времени по специалистам
   * @deprecated Backend route was removed; retained for import compatibility.
   */
  getTimeBySpecialist: async (
    from: string,
    to: string,
  ): Promise<TimeReportBySpecialist[]> => {
    void from; void to;
    return legacyReportUnavailable();
  },

  /**
   * Отчёт по времени по линиям поддержки
   * @deprecated Backend route was removed; retained for import compatibility.
   */
  getTimeByLine: async (
    from: string,
    to: string,
  ): Promise<TimeReportByLine[]> => {
    void from; void to;
    return legacyReportUnavailable();
  },

  /**
   * История тикета с временной статистикой
   */
  getTicketHistory: async (ticketId: number): Promise<TicketHistory> => {
    return (await generated.getTicketHistory(ticketId)).data as TicketHistory;
  },

  /**
   * История переназначений тикета
   */
  getReassignmentHistory: async (
    ticketId: number,
  ): Promise<ReassignmentHistory[]> => {
    return (await generated.getReassignmentHistory(ticketId)).data as ReassignmentHistory[];
  },

  /**
   * Статистика времени решения тикетов
   */
  getResolutionTimeStats: async (): Promise<ResolutionTimeStats> => {
    return (await generated.getResolutionTimeStats()).data as ResolutionTimeStats;
  },

  /**
   * Статистика по пользовательским категориям
   */
  getStatsByUserCategory: async (): Promise<TicketStatsByCategory[]> => {
    return (await generated.getTicketStatsByUserCategory()).data as TicketStatsByCategory[];
  },

  /**
   * Статистика по категориям поддержки
   */
  getStatsBySupportCategory: async (): Promise<TicketStatsByCategory[]> => {
    return (await generated.getTicketStatsBySupportCategory()).data as TicketStatsByCategory[];
  },

  /**
   * Статистика по статусам
   */
  getStatsByStatus: async (): Promise<TicketStatsByStatus[]> => {
    return (await generated.getTicketStatsByStatus()).data as TicketStatsByStatus[];
  },

  /**
   * Все тикеты (включая удалённые) — пагинация
   */
  getAllTickets: async (
    page = 0,
    size = 20,
    filter: AllTicketsFilter = {},
  ): Promise<PaginatedResponse<TicketReportListResponse>> => {
    return toPage((await generated.getAllTickets({ pageable: { page, size }, filter })).data) as PaginatedResponse<TicketReportListResponse>;
  },

  /**
   * Загрузка специалистов
   * @deprecated Backend route was removed; retained for import compatibility.
   */
  getSpecialistWorkload: async (): Promise<SpecialistWorkload[]> => {
    return legacyReportUnavailable();
  },

  /**
   * Апи получения XLSX отчета по задачам отдела
   */

  downloadScheduledTaskReport: async (
    departmentId: number,
    year: number,
    month: number,
  ): Promise<Blob> => {
    return await generated.exportReport({ departmentId, year, month });
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
  SpecialistWorkload,
};
