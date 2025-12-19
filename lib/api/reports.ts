import api from './client';
import type { ApiResponse } from '@/types/api';

/**
 * Reports API
 * Эндпоинты для отчётов и статистики
 */

// Types
export interface TicketStatsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TicketStatsByCategory {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  count: number;
  percentage: number;
}

export interface ResolutionTimeStats {
  totalResolved: number;
  avgResolutionSeconds: number;
  minResolutionSeconds: number;
  maxResolutionSeconds: number;
  medianResolutionSeconds: number;
  formattedAvgTime: string;
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

// API Methods
export const reportsApi = {
  /**
   * Статистика тикетов по статусам
   */
  async getTicketsByStatus(): Promise<TicketStatsByStatus[]> {
    const response = await api.get<ApiResponse<TicketStatsByStatus[]>>(
      '/reports/tickets/by-status'
    );
    return response.data.data;
  },

  /**
   * Статистика тикетов по пользовательским категориям
   */
  async getTicketsByUserCategory(): Promise<TicketStatsByCategory[]> {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      '/reports/tickets/by-user-category'
    );
    return response.data.data;
  },

  /**
   * Статистика тикетов по категориям поддержки
   */
  async getTicketsBySupportCategory(): Promise<TicketStatsByCategory[]> {
    const response = await api.get<ApiResponse<TicketStatsByCategory[]>>(
      '/reports/tickets/by-support-category'
    );
    return response.data.data;
  },

  /**
   * Статистика по времени решения тикетов
   */
  async getResolutionTimeStats(): Promise<ResolutionTimeStats> {
    const response = await api.get<ApiResponse<ResolutionTimeStats>>(
      '/reports/tickets/resolution-time'
    );
    return response.data.data;
  },

  /**
   * Загрузка специалистов
   */
  async getSpecialistWorkload(): Promise<SpecialistWorkload[]> {
    const response = await api.get<ApiResponse<SpecialistWorkload[]>>(
      '/reports/specialists/workload'
    );
    return response.data.data;
  },
};
