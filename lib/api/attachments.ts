import api from "./client";
import type { ApiResponse } from "@/types/api";
import type {
  AttachmentResponse,
  UploadUrlResponse,
  ConfirmUploadRequest,
  InitiateMultipartResponse,
  MultipartPartInfo,
} from "@/types/attachment";

type TargetType = "TICKET" | "MESSAGE" | "DIRECT_MESSAGE" | "WIKI_ARTICLE";

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
    targetType: "TICKET" | "MESSAGE" | "DIRECT_MESSAGE" | "WIKI_ARTICLE",
    targetId: number,
  ): Promise<UploadUrlResponse> => {
    const response = await api.post<ApiResponse<UploadUrlResponse>>(
      "/attachments/upload-url",
      {
        filename,
        contentType,
        targetType,
        targetId,
      },
    );
    return response.data.data;
  },

  // 2. Confirm upload
  confirmUpload: async (
    data: ConfirmUploadRequest,
  ): Promise<AttachmentResponse> => {
    const response = await api.post<ApiResponse<AttachmentResponse>>(
      "/attachments/confirm",
      data,
    );
    return response.data.data;
  },

  // 3. Get Presigned URL for download/view
  getUrl: async (attachmentId: number): Promise<{ downloadUrl: string }> => {
    const response = await api.get<ApiResponse<{ downloadUrl: string }>>(
      `/attachments/${attachmentId}/url`,
    );
    return response.data.data;
  },

  // 4. Get Presigned URL for inline view (no Content-Disposition: attachment)
  getViewUrl: async (attachmentId: number): Promise<{ viewUrl: string }> => {
    const response = await api.get<ApiResponse<{ viewUrl: string }>>(
      `/attachments/${attachmentId}/view-url`,
    );
    return response.data.data;
  },

  // ============ Multipart Upload (файлы > 5 ГБ) ============

  // M1. Инициировать multipart upload
  initiateMultipart: async (data: {
    filename: string;
    contentType: string;
    targetType: TargetType;
    targetId: number;
  }): Promise<InitiateMultipartResponse> => {
    const response = await api.post<ApiResponse<InitiateMultipartResponse>>(
      "/attachments/multipart/initiate",
      data,
    );
    return response.data.data;
  },

  // M2. Получить presigned URL для одной части
  getPartUrl: async (data: {
    fileKey: string;
    bucket: string;
    uploadId: string;
    partNumber: number;
  }): Promise<{ partUrl: string }> => {
    const response = await api.post<ApiResponse<{ partUrl: string }>>(
      "/attachments/multipart/part-url",
      data,
    );
    return response.data.data;
  },

  // M3. Завершить multipart upload
  completeMultipart: async (data: {
    fileKey: string;
    bucket: string;
    uploadId: string;
    parts: MultipartPartInfo[];
    filename: string;
    contentType: string;
    fileSize: number;
    targetType: TargetType;
    targetId: number;
  }): Promise<AttachmentResponse> => {
    const response = await api.post<ApiResponse<AttachmentResponse>>(
      "/attachments/multipart/complete",
      data,
    );
    return response.data.data;
  },

  // M4. Отменить multipart upload (cleanup при ошибке)
  abortMultipart: async (data: {
    fileKey: string;
    bucket: string;
    uploadId: string;
  }): Promise<void> => {
    await api.post("/attachments/multipart/abort", data);
  },
};
