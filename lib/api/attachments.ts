import { getServiceDeskAPI } from './generated/client';
import type { ConfirmUploadRequest as WireConfirmUploadRequest, CompleteMultipartRequest, InitiateMultipartRequest, PartUrlRequest, UploadUrlRequest, AbortMultipartRequest, AttachmentResponse as WireAttachmentResponse } from './generated/models';
import { requireData } from './ticketContractView';
import type { AttachmentResponse, UploadUrlResponse, ConfirmUploadRequest, InitiateMultipartResponse, MultipartPartInfo } from '@/types/attachment';

const generated = getServiceDeskAPI();
type TargetType = UploadUrlRequest['targetType'];
const asAttachment = (value: WireAttachmentResponse): AttachmentResponse => value as AttachmentResponse;
const asUrl = (value: unknown): UploadUrlResponse => value as UploadUrlResponse;
const asMultipart = (value: unknown): InitiateMultipartResponse => value as InitiateMultipartResponse;

export const attachmentApi = {
  delete: async (attachmentId: number): Promise<void> => { await generated.deleteAttachment(attachmentId); },
  getUploadUrl: async (filename: string, contentType: string, targetType: TargetType, targetId: number): Promise<UploadUrlResponse> =>
    asUrl(requireData(await generated.getUploadUrl2({ filename, contentType, targetType, targetId }))),
  confirmUpload: async (data: ConfirmUploadRequest): Promise<AttachmentResponse> =>
    asAttachment(requireData(await generated.confirmUpload2(data as WireConfirmUploadRequest))),
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
  completeMultipart: async (data: { fileKey: string; bucket: string; uploadId: string; parts: MultipartPartInfo[]; filename: string; contentType: string; fileSize: number; targetType: TargetType; targetId: number }): Promise<AttachmentResponse> =>
    asAttachment(requireData(await generated.completeMultipart1(data as CompleteMultipartRequest))),
  abortMultipart: async (data: AbortMultipartRequest): Promise<void> => { await generated.abortMultipart1(data); },
};
