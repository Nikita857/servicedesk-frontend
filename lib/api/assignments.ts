import api from './client';

// Assignment types based on OpenAPI spec

export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type AssignmentMode = 'FIRST_AVAILABLE' | 'ROUND_ROBIN' | 'LEAST_LOADED' | 'DIRECT';

export interface Assignment {
  id: number;
  ticketId: number;
  ticketTitle: string;
  fromLineId: number | null;
  fromLineName: string | null;
  fromUserId: number | null;
  fromUsername: string | null;
  fromFio: string | null;
  toLineId: number;
  toLineName: string;
  toUserId: number | null;
  toUsername: string | null;
  toFio: string | null;
  note: string;
  mode: AssignmentMode;
  status: AssignmentStatus;
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

export interface CreateAssignmentRequest {
  ticketId: number;
  toLineId: number;
  toUserId?: number;
  fromLineId?: number;
  fromUserId?: number;
  note: string;
  mode?: AssignmentMode;
}

export interface RejectAssignmentRequest {
  reason: string;
}

export interface PagedAssignments {
  content: Assignment[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const assignmentApi = {
  // Create new assignment (escalate ticket)
  create: async (data: CreateAssignmentRequest): Promise<Assignment> => {
    const response = await api.post<ApiResponse<Assignment>>('/assignments', data);
    return response.data.data;
  },

  // Get assignment by ID
  get: async (id: number): Promise<Assignment> => {
    const response = await api.get<ApiResponse<Assignment>>(`/assignments/${id}`);
    return response.data.data;
  },

  // Get current active assignment for ticket
  getCurrentForTicket: async (ticketId: number): Promise<Assignment | null> => {
    try {
      const response = await api.get<ApiResponse<Assignment>>(`/tickets/${ticketId}/current-assignment`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Get assignment history for ticket
  getTicketHistory: async (ticketId: number): Promise<Assignment[]> => {
    const response = await api.get<ApiResponse<Assignment[]>>(`/tickets/${ticketId}/assignments`);
    return response.data.data;
  },

  // Get my pending assignments
  getMyPending: async (page = 0, size = 20): Promise<PagedAssignments> => {
    const response = await api.get<ApiResponse<PagedAssignments>>('/assignments/pending', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get pending count
  getPendingCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<number>>('/assignments/pending-count');
    return response.data.data;
  },

  // Accept assignment
  accept: async (id: number): Promise<Assignment> => {
    const response = await api.post<ApiResponse<Assignment>>(`/assignments/${id}/accept`);
    return response.data.data;
  },

  // Reject assignment
  reject: async (id: number, reason: string): Promise<Assignment> => {
    const response = await api.post<ApiResponse<Assignment>>(`/assignments/${id}/reject`, { reason });
    return response.data.data;
  },
};
