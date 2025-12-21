import api from './client';
import type { ApiResponse } from '@/types/api';

export interface SupportLine {
  id: number;
  name: string;
  description: string | null;
  slaMinutes: number;
  specialistCount: number;
  displayOrder: number;
}

// Alias for backwards compatibility
export type SupportLineShort = SupportLine;

export interface Specialist {
  id: number;
  username: string;
  fio: string | null;
  active: boolean;
  activityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'BUSY' | 'TECHNICAL_ISSUE' | 'OFFLINE';
  availableForAssignment?: boolean;
}

export const supportLineApi = {
  // Get all support lines
  list: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>('/support-lines');
    return response.data.data;
  },

  // Alias for list
  getAll: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>('/support-lines');
    return response.data.data;
  },

  // Get support line by ID
  get: async (id: number): Promise<SupportLine> => {
    const response = await api.get<ApiResponse<SupportLine>>(`/support-lines/${id}`);
    return response.data.data;
  },

  // Get specialists in a support line
  getSpecialists: async (lineId: number): Promise<Specialist[]> => {
    const response = await api.get<ApiResponse<Specialist[]>>(`/support-lines/${lineId}/specialists`);
    return response.data.data;
  },

  // Get my lines (for specialists)
  getMyLines: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>('/support-lines/my-lines');
    return response.data.data;
  },
};

// Assignment API - forwarding related
export const assignmentApi = {
  /**
   * Get available lines for forwarding based on user role
   * Respects forwarding rules: SYSADMIN → 1CSUPPORT, etc.
   */
  getAvailableForwardingLines: async (): Promise<SupportLine[]> => {
    const response = await api.get<ApiResponse<SupportLine[]>>('/assignments/available-lines');
    return response.data.data;
  },
};

