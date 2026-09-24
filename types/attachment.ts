import type {
  ConfirmUploadRequest as WireConfirmUploadRequest,
  AttachmentResponse as WireAttachmentResponse,
  UploadUrlResponse as WireUploadUrlResponse,
  InitiateMultipartResponse as WireInitiateMultipartResponse,
  UserShortResponse as WireUserShortResponse,
  PartInfo,
  WikiImageResponse,
  WikiMediaUploadUrlResponse as WireWikiMediaUploadUrlResponse,
} from "@/lib/api/generated/models";

export type AttachmentResponse = Pick<Required<WireAttachmentResponse>,
  'id' | 'filename' | 'url' | 'fileSize' | 'mimeType' | 'type' | 'createdAt'> & {
  uploadedBy: Pick<Required<WireUserShortResponse>, 'id' | 'username'> & { fio: string | null };
};

export type UploadUrlResponse = Pick<Required<WireUploadUrlResponse>, 'uploadUrl' | 'fileKey' | 'bucket'>;

export type ConfirmUploadRequest = WireConfirmUploadRequest;

// ===== Multipart Upload (файлы > 5 ГБ) =====

export type InitiateMultipartResponse = Required<WireInitiateMultipartResponse>;

export type MultipartPartInfo = PartInfo;

export type WikiMediaUploadUrlResponse = Required<WireWikiMediaUploadUrlResponse>;
export type WikiMediaResponse = Required<WikiImageResponse>;
