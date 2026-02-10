import { PagedTicketList, TicketStatus } from "@/types";
import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

/**
 * Stats API
 * Эндпоинты статистики тикетов
 */

// Types
export interface UserTicketStats {
  userId: number;
  username: string;
  total: number;
  open: number;
  resolved: number;
  closed: number;
  waiting: number;
  byStatus: Record<string, number>;
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
}

interface StatsQueryParams {
  page?: number;
  size?: number;
}

interface listBySupLineAndStatusParams {
  ticketStatus: TicketStatus;
  lineId: number;
  page: number;
  size: number;
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
   * Возвращает список тикетов отсортированный по статусу и линии поддержки
   * @param ticketStatus статус тикета для сортировки
   * @param lineId ID линии поддержки для сортировки
   * @param page 
   * @param size 
   */
  async listBySupportLineAndStatus(params: listBySupLineAndStatusParams) : Promise<PagedTicketList> {
      const response = await api.get<ApiResponse<PagedTicketList>>(
        "/stats/tickets/by-line-with-tickets",
        {params},
      );
      return response.data.data;
    },

  /**
   * Статистика по всем доступным линиям
   * Специалисты видят только свои линии, ADMIN — все
   */
  async getStatsByAllLines(
    params?: StatsQueryParams,
  ): Promise<PaginatedResponse<LineTicketStats>> {
    const response = await api.get<ApiResponse<PaginatedResponse<LineTicketStats>>>(
      "/stats/tickets/by-line",
      { params }
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
