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

  // ============ MinIO Migration ============

  // 1. Get Presigned URL for upload
  getUploadUrl: async (
    filename: string, 
    contentType: string, 
    targetType: 'TICKET' | 'MESSAGE' | 'DIRECT_MESSAGE' | 'WIKI_ARTICLE',
    targetId: number
  ): Promise<UploadUrlResponse> => {
    const response = await api.post<ApiResponse<UploadUrlResponse>>('/attachments/upload-url', {
      filename,
      contentType,
      targetType,
      targetId
    });
    return response.data.data;
  },

  // 2. Confirm upload
  confirmUpload: async (data: ConfirmUploadRequest): Promise<Attachment> => {
    const response = await api.post<ApiResponse<Attachment>>('/attachments/confirm', data);
    return response.data.data;
  },

  // 3. Get Presigned URL for download/view
  getUrl: async (attachmentId: number): Promise<{ downloadUrl: string }> => {
    const response = await api.get<ApiResponse<{ downloadUrl: string }>>(`/attachments/${attachmentId}/url`);
    return response.data.data;
  },
};

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  bucket: string;
}

export interface ConfirmUploadRequest {
  fileKey: string;
  filename: string;
  contentType: string;
  fileSize: number;
  bucket: string;
  targetType: 'TICKET' | 'MESSAGE' | 'DIRECT_MESSAGE' | 'WIKI_ARTICLE';
  targetId: number;
}


