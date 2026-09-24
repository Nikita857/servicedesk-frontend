import { getServiceDeskAPI } from './generated/client';
import type { CompleteMultipartRequest, InitiateMultipartRequest, PartUrlRequest, UploadUrlRequest, AbortMultipartRequest, AttachmentResponse as WireAttachmentResponse, UploadUrlResponse as WireUploadUrlResponse, InitiateMultipartResponse as WireInitiateMultipartResponse } from './generated/models';
import { requireData } from './ticketContractView';
import type { AttachmentResponse, UploadUrlResponse, ConfirmUploadRequest, InitiateMultipartResponse } from '@/types/attachment';

const generated = getServiceDeskAPI();
type TargetType = UploadUrlRequest['targetType'];
const asAttachment = (value: WireAttachmentResponse): AttachmentResponse => {
  const uploader = value.uploadedBy;
  if (value.id == null || value.filename == null || value.url == null || value.fileSize == null ||
      value.mimeType == null || value.type == null || value.createdAt == null ||
      uploader?.id == null || uploader.username == null) {
    throw new Error('Attachment response is missing required data');
  }
  return {
    id: value.id,
    filename: value.filename,
    url: value.url,
    fileSize: value.fileSize,
    mimeType: value.mimeType,
    type: value.type,
    uploadedBy: { id: uploader.id, username: uploader.username, fio: uploader.fio ?? null },
    createdAt: value.createdAt,
  };
};
const asUrl = (value: WireUploadUrlResponse): UploadUrlResponse => {
  if (value.uploadUrl == null || value.fileKey == null || value.bucket == null) {
    throw new Error('Upload URL response is missing required data');
  }
  return { uploadUrl: value.uploadUrl, fileKey: value.fileKey, bucket: value.bucket };
};
const asMultipart = (value: WireInitiateMultipartResponse): InitiateMultipartResponse => {
  if (value.uploadId == null || value.fileKey == null || value.bucket == null) {
    throw new Error('Multipart initiation response is missing required data');
  }
  return { uploadId: value.uploadId, fileKey: value.fileKey, bucket: value.bucket };
};

export const attachmentApi = {
  delete: async (attachmentId: number): Promise<void> => { await generated.deleteAttachment(attachmentId); },
  getUploadUrl: async (filename: string, contentType: string, targetType: TargetType, targetId: number): Promise<UploadUrlResponse> =>
    asUrl(requireData(await generated.getUploadUrl2({ filename, contentType, targetType, targetId }))),
  confirmUpload: async (data: ConfirmUploadRequest): Promise<AttachmentResponse> =>
    asAttachment(requireData(await generated.confirmUpload2(data))),
  getUrl: async (attachmentId: number): Promise<{ downloadUrl: string }> => {
    const data = requireData(await generated.getDownloadUrl(attachmentId));
    if (!data.downloadUrl) throw new Error('Download URL is missing');
    return { downloadUrl: data.downloadUrl };
  },
  getViewUrl: async (attachmentId: number): Promise<{ viewUrl: string }> => {
    const data = requireData(await generated.getViewUrl(attachmentId));
    if (!data.viewUrl) throw new Error('View URL is missing');
    return { viewUrl: data.viewUrl };
  },
  download: async (attachmentId: number): Promise<Blob> => generated.downloadById(attachmentId),
  initiateMultipart: async (data: InitiateMultipartRequest): Promise<InitiateMultipartResponse> =>
    asMultipart(requireData(await generated.initiateMultipart1(data))),
  getPartUrl: async (data: PartUrlRequest): Promise<{ partUrl: string }> => {
    const value = requireData(await generated.getPartUrl1(data));
    if (!value.partUrl) throw new Error('Multipart part URL is missing');
    return { partUrl: value.partUrl };
  },
  completeMultipart: async (data: CompleteMultipartRequest): Promise<AttachmentResponse> =>
    asAttachment(requireData(await generated.completeMultipart1(data))),
  abortMultipart: async (data: AbortMultipartRequest): Promise<void> => { await generated.abortMultipart1(data); },
};
