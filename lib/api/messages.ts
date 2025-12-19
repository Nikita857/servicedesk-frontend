import api from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Message,
  PagedMessages,
  SendMessageRequest,
  EditMessageRequest,
} from '@/types/message';

export const messageApi = {
  // Get messages for a ticket (paginated)
  list: async (ticketId: number, page = 0, size = 50): Promise<PagedMessages> => {
    const response = await api.get<ApiResponse<PagedMessages>>(
      `/tickets/${ticketId}/messages`,
      { params: { page, size, sort: 'createdAt,desc' } }
    );
    return response.data.data;
  },

  // Send a new message
  send: async (ticketId: number, data: SendMessageRequest): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>(
      `/tickets/${ticketId}/messages`,
      data
    );
    return response.data.data;
  },

  // Edit a message
  edit: async (messageId: number, data: EditMessageRequest): Promise<Message> => {
    const response = await api.patch<ApiResponse<Message>>(
      `/messages/${messageId}`,
      data
    );
    return response.data.data;
  },

  // Delete a message
  delete: async (messageId: number): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
  },

  // Mark all messages as read
  markAsRead: async (ticketId: number): Promise<number> => {
    const response = await api.post<ApiResponse<number>>(
      `/tickets/${ticketId}/messages/read`
    );
    return response.data.data;
  },

  // Get unread count
  getUnreadCount: async (ticketId: number): Promise<number> => {
    const response = await api.get<ApiResponse<number>>(
      `/tickets/${ticketId}/messages/unread-count`
    );
    return response.data.data;
  },
};
