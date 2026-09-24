import type {
  ConfirmUploadRequest as WireConfirmUploadRequest,
  PartInfo,
  WikiImageResponse,
  WikiMediaUploadUrlResponse as WireWikiMediaUploadUrlResponse,
  WikiVideoMultipartInitResponse,
} from "@/lib/api/generated/models";

export interface AttachmentResponse {
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

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  bucket: string;
}

export type ConfirmUploadRequest = WireConfirmUploadRequest;

// ===== Multipart Upload (файлы > 5 ГБ) =====

export type InitiateMultipartResponse = Required<WikiVideoMultipartInitResponse>;

export type MultipartPartInfo = PartInfo;

export type WikiMediaUploadUrlResponse = Required<WireWikiMediaUploadUrlResponse>;
export type WikiMediaResponse = Required<WikiImageResponse>;
