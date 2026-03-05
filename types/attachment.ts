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

export interface ConfirmUploadRequest {
  fileKey: string;
  filename: string;
  contentType: string;
  fileSize: number;
  bucket: string;
  targetType: 'TICKET' | 'MESSAGE' | 'DIRECT_MESSAGE' | 'WIKI_ARTICLE';
  targetId: number;
}

export interface WikiMediaUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  filename: string;
  bucket: string;
}

export interface WikiMediaResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  fileKey: string;
}
