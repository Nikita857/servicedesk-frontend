import { PagedTicketList } from "@/types";
import type { PaginatedResponse } from "@/types/api";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
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
const generated = getServiceDeskAPI();

export const statsApi = {
  /**
   * Моя статистика тикетов
   * Доступно всем пользователям
   */
  async getMyStats(params?: StatsQueryParams): Promise<UserTicketStatsResponse> {
    void params;
    return (await generated.getMyStats()).data as UserTicketStatsResponse;
  },

  /**
   * Возвращает список тикетов отсортированный по статусу и линии поддержки
   * @param ticketStatus статус тикета для сортировки
   * @param lineId ID линии поддержки для сортировки
   * @param page
   * @param size
   */
  async listBySupportLineAndStatus(params: ListBySupLineAndStatusParams) : Promise<PagedTicketList> {
      return toPage((await generated.getTicketsByLineAndStatus({ lineId: params.lineId, ticketStatus: params.ticketStatus, pageable: { page: params.page, size: params.size } })).data) as PagedTicketList;
    },

  /**
   * Статистика по всем доступным линиям
   * Специалисты видят только свои линии, ADMIN — все
   */
  async getStatsByAllLines(
    params?: StatsQueryParams,
  ): Promise<PaginatedResponse<LineTicketStatsResponse>> {
    return toPage((await generated.getStatsByAllLines(params)).data) as PaginatedResponse<LineTicketStatsResponse>;
  },

  /**
   * Статистика для конкретной линии
   * Специалисты могут видеть только свои линии, ADMIN — любую
   */
  async getStatsByLine(
    lineId: number,
    params?: StatsQueryParams,
  ): Promise<LineTicketStatsResponse> {
    void params;
    return (await generated.getStatsByLine(lineId)).data as LineTicketStatsResponse;
  },

  /**
   * Глобальная статистика
   * Только для ADMIN
   */
  async getGlobalStats(params?: StatsQueryParams): Promise<UserTicketStatsResponse> {
    void params;
    return (await generated.getGlobalStats()).data as UserTicketStatsResponse;
  },
};
