import { PagedTicketList } from "@/types";
import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  UserTicketStatsResponse,
  LineTicketStatsResponse,
  StatsQueryParams,
  ListBySupLineAndStatusParams,
} from "@/types/stats";

/**
 * Stats API
 * Эндпоинты статистики заявок
 */

// API Methods
export const statsApi = {
  /**
   * Моя статистика тикетов
   * Доступно всем пользователям
   */
  async getMyStats(params?: StatsQueryParams): Promise<UserTicketStatsResponse> {
    const response = await api.get<ApiResponse<UserTicketStatsResponse>>(
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
  async listBySupportLineAndStatus(params: ListBySupLineAndStatusParams) : Promise<PagedTicketList> {
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
  ): Promise<PaginatedResponse<LineTicketStatsResponse>> {
    const response = await api.get<ApiResponse<PaginatedResponse<LineTicketStatsResponse>>>(
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
  ): Promise<LineTicketStatsResponse> {
    const response = await api.get<ApiResponse<LineTicketStatsResponse>>(
      `/stats/tickets/by-line/${lineId}`,
      { params },
    );
    return response.data.data;
  },

  /**
   * Глобальная статистика
   * Только для ADMIN
   */
  async getGlobalStats(params?: StatsQueryParams): Promise<UserTicketStatsResponse> {
    const response = await api.get<ApiResponse<UserTicketStatsResponse>>(
      "/stats/tickets/global",
      { params },
    );
    return response.data.data;
  },
};
