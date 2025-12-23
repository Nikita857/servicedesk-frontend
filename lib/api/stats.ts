import api from './client';
import type { ApiResponse } from '@/types/api';

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

// API Methods
export const statsApi = {
  /**
   * Моя статистика тикетов
   * Доступно всем пользователям
   */
  async getMyStats(): Promise<UserTicketStats> {
    const response = await api.get<ApiResponse<UserTicketStats>>(
      '/stats/tickets/my'
    );
    return response.data.data;
  },

  /**
   * Статистика по всем доступным линиям
   * Специалисты видят только свои линии, ADMIN — все
   */
  async getStatsByAllLines(): Promise<LineTicketStats[]> {
    const response = await api.get<ApiResponse<LineTicketStats[]>>(
      '/stats/tickets/by-line'
    );
    return response.data.data;
  },

  /**
   * Статистика для конкретной линии
   * Специалисты могут видеть только свои линии, ADMIN — любую
   */
  async getStatsByLine(lineId: number): Promise<LineTicketStats> {
    const response = await api.get<ApiResponse<LineTicketStats>>(
      `/stats/tickets/by-line/${lineId}`
    );
    return response.data.data;
  },

  /**
   * Глобальная статистика
   * Только для ADMIN
   */
  async getGlobalStats(): Promise<UserTicketStats> {
    const response = await api.get<ApiResponse<UserTicketStats>>(
      '/stats/tickets/global'
    );
    return response.data.data;
  },
};
