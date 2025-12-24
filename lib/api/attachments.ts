import api from './client';
import { API_BASE_URL, API_SERVER_URL } from '../config';
import type { ApiResponse } from '@/types/api';

export interface Attachment {
  id: number;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  type: 'PHOTO' | 'SCREENSHOT' | 'VIDEO' | 'DOCUMENT';
  uploadedBy: {
    id: number;
    username: string;
    fio: string | null;
  };
  createdAt: string;
}

/**
 * Get download URL for attachment by ID (new API)
 * Uses GET /api/v1/attachments/{attachmentId}/download
 */
export const getAttachmentDownloadUrl = (attachmentId: number): string => {
  return `${API_BASE_URL}/attachments/${attachmentId}/download`;
};

/**
 * Get full URL for attachment file (legacy - uses url field)
 * @deprecated Use getAttachmentDownloadUrl(attachmentId) instead
 */
export const getAttachmentUrl = (url: string): string => {
  return `${API_SERVER_URL}${url}`;
};

export const attachmentApi = {
  // Upload to ticket
  uploadToTicket: async (ticketId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ApiResponse<Attachment>>(
      `/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Upload to message
  uploadToMessage: async (messageId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ApiResponse<Attachment>>(
      `/messages/${messageId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Get ticket attachments
  getByTicket: async (ticketId: number): Promise<Attachment[]> => {
    const response = await api.get<ApiResponse<Attachment[]>>(`/tickets/${ticketId}/attachments`);
    return response.data.data;
  },

  // Get message attachments
  getByMessage: async (messageId: number): Promise<Attachment[]> => {
    const response = await api.get<ApiResponse<Attachment[]>>(`/messages/${messageId}/attachments`);
    return response.data.data;
  },

  // Delete attachment
  delete: async (attachmentId: number): Promise<void> => {
    await api.delete(`/attachments/${attachmentId}`);
  },

  // Get download URL (legacy)
  getDownloadUrl: (filename: string): string => {
    return `${API_BASE_URL}/attachments/file/${filename}`;
  },
};

