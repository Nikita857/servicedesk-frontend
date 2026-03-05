import api from './client';
import type {ApiResponse} from '@/types/api';
import type {AttachmentResponse, UploadUrlResponse, ConfirmUploadRequest} from '@/types/attachment';

export const attachmentApi = {
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
    confirmUpload: async (data: ConfirmUploadRequest): Promise<AttachmentResponse> => {
        const response = await api.post<ApiResponse<AttachmentResponse>>('/attachments/confirm', data);
        return response.data.data;
    },

    // 3. Get Presigned URL for download/view
    getUrl: async (attachmentId: number): Promise<{ downloadUrl: string }> => {
        const response = await api.get<ApiResponse<{ downloadUrl: string }>>(`/attachments/${attachmentId}/url`);
        return response.data.data;
    },
};
