import api from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Ticket,
  PagedTicketList,
  CreateTicketRequest,
  UpdateTicketRequest,
  ChangeStatusRequest,
  TicketStatus,
} from '@/types/ticket';

export const ticketApi = {
  // List all tickets (paginated)
  list: async (page = 0, size = 20): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>('/tickets', {
      params: { page, size },
    });
    return response.data.data;
  },

  /**
   * List all tickets without pagination limit
   * @deprecated Consider using a dedicated counts API endpoint for better performance
   */
  listAll: async (page = 0, size = 10000): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>('/tickets', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get tickets by status
  listByStatus: async (status: TicketStatus, page = 0, size = 20): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>(`/tickets/status/${status}`, {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get my tickets (created by me)
  listMy: async (page = 0, size = 20): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>('/tickets/my', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get tickets assigned to me
  listAssigned: async (page = 0, size = 20): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>('/tickets/assigned', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get tickets by support line
  listByLine: async (lineId: number, page = 0, size = 20): Promise<PagedTicketList> => {
    const response = await api.get<ApiResponse<PagedTicketList>>(`/tickets/line/${lineId}`, {
      params: { page, size },
    });
    return response.data.data;
  },

  // Get single ticket
  get: async (id: number): Promise<Ticket> => {
    const response = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return response.data.data;
  },

  // Create ticket
  create: async (data: CreateTicketRequest): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>('/tickets', data);
    return response.data.data;
  },

  // Update ticket
  update: async (id: number, data: UpdateTicketRequest): Promise<Ticket> => {
    const response = await api.put<ApiResponse<Ticket>>(`/tickets/${id}`, data);
    return response.data.data;
  },

  // Change status
  changeStatus: async (id: number, data: ChangeStatusRequest): Promise<Ticket> => {
    const response = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, data);
    return response.data.data;
  },

  // Assign to specialist
  assignToSpecialist: async (id: number, specialistId: number, comment?: string): Promise<Ticket> => {
    const response = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign-specialist`, null, {
      params: { specialistId, comment },
    });
    return response.data.data;
  },

  // Assign to support line
  assignToLine: async (id: number, lineId: number, comment?: string): Promise<Ticket> => {
    const response = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign-line`, null, {
      params: { lineId, comment },
    });
    return response.data.data;
  },

  // Take ticket into work (specialist becomes assignee)
  takeTicket: async (id: number): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/take`);
    return response.data.data;
  },

  // Delete ticket
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },

  // ============ Two-factor closure ============

  /**
   * Confirm ticket closure (user endpoint)
   * Moves ticket from PENDING_CLOSURE to CLOSED
   */
  confirmClosure: async (id: number): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/confirm-closure`);
    return response.data.data;
  },

  /**
   * Reject ticket closure (user endpoint)
   * Moves ticket from PENDING_CLOSURE to REOPENED
   */
  rejectClosure: async (id: number, reason?: string): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/reject-closure`, null, {
      params: reason ? { reason } : undefined,
    });
    return response.data.data;
  },

  /**
   * Get status history for a ticket
   */
  getStatusHistory: async (id: number): Promise<TicketStatusHistory[]> => {
    const response = await api.get<ApiResponse<TicketStatusHistory[]>>(`/tickets/${id}/status-history`);
    return response.data.data;
  },

  /**
   * Rate a closed ticket (only ticket creator can rate, once)
   */
  rateTicket: async (id: number, request: RateTicketRequest): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/rate`, request);
    return response.data.data;
  },

  /**
   * Cancel ticket (only ticket creator or admin can cancel)
   * Ticket will be marked as CANCELLED and soft deleted
   */
  cancelTicket: async (id: number, reason?: string): Promise<Ticket> => {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/cancel`, null, {
      params: reason ? { reason } : undefined,
    });
    return response.data.data;
  },
};

// Request type for rating
export interface RateTicketRequest {
  rating: number; // 1-5
  feedback?: string;
}

// Status history response type
export interface TicketStatusHistory {
  id: number;
  status: string;
  enteredAt: string;
  exitedAt: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  changedByUsername: string | null;
  changedByFio: string | null;
  comment: string | null;
}


