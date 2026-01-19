import api from "./client";
import type { ApiResponse } from "@/types/api";
import type { TicketListItem } from "@/types/ticket";

/**
 * Stats API
 * Эндпоинты статистики тикетов
 */

// Types
export interface TicketPageResponse {
  content: TicketListItem[];
  totalCount: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export interface UserTicketStats {
  userId: number;
  username: string;
  total: number;
  open: number;
  resolved: number;
  closed: number;
  waiting: number;
  byStatus: Record<string, number>;
  ticketsByStatus?: Record<string, TicketPageResponse>;
}

export interface LineTicketStats {
  lineId: number;
  lineName: string;
  total: number;
  open: number;
  resolved: number;
  closed: number;
  unassigned: number;
  newTickets: number;
  byStatus: Record<string, number>;
  ticketsByStatus?: Record<string, TicketPageResponse>;
}

interface StatsQueryParams {
  includeTickets?: boolean;
  pageSize?: number;
}

// API Methods
export const statsApi = {
  /**
   * Моя статистика тикетов
   * Доступно всем пользователям
   */
  async getMyStats(params?: StatsQueryParams): Promise<UserTicketStats> {
    const response = await api.get<ApiResponse<UserTicketStats>>(
      "/stats/tickets/my",
      { params },
    );
    return response.data.data;
  },

  /**
   * Статистика по всем доступным линиям
   * Специалисты видят только свои линии, ADMIN — все
   */
  async getStatsByAllLines(
    params?: StatsQueryParams,
  ): Promise<LineTicketStats[]> {
    const response = await api.get<ApiResponse<LineTicketStats[]>>(
      "/stats/tickets/by-line",
      { params },
    );
    return response.data.data;
  },

  /**
   * Статистика для конкретной линии
   * Специалисты могут видеть только свои линии, ADMIN — любую
   */
  async getStatsByLine(
    lineId: number,
    params?: StatsQueryParams,
  ): Promise<LineTicketStats> {
    const response = await api.get<ApiResponse<LineTicketStats>>(
      `/stats/tickets/by-line/${lineId}`,
      { params },
    );
    return response.data.data;
  },

  /**
   * Глобальная статистика
   * Только для ADMIN
   */
  async getGlobalStats(params?: StatsQueryParams): Promise<UserTicketStats> {
    const response = await api.get<ApiResponse<UserTicketStats>>(
      "/stats/tickets/global",
      { params },
    );
    return response.data.data;
  },
};
