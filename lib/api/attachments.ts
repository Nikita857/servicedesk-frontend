import api from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Get full URL for attachment file
 * If url starts with http, return as is
 * Otherwise prepend API base URL
 */
export const getAttachmentUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // URL from backend like "/attachments/file/uuid" or just "uuid"
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/attachments/file/${url}`;
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

