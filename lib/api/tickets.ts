import api from './client';
import type {
  Ticket,
  PagedTicketList,
  CreateTicketRequest,
  UpdateTicketRequest,
  ChangeStatusRequest,
  TicketStatus,
} from '@/types/ticket';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const ticketApi = {
  // List all tickets (paginated)
  list: async (page = 0, size = 20): Promise<PagedTicketList> => {
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
  assignToSpecialist: async (id: number, specialistId: number): Promise<Ticket> => {
    const response = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign-specialist`, null, {
      params: { specialistId },
    });
    return response.data.data;
  },

  // Assign to support line
  assignToLine: async (id: number, lineId: number): Promise<Ticket> => {
    const response = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign-line`, null, {
      params: { lineId },
    });
    return response.data.data;
  },

  // Delete ticket
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },
};
