import type { PageObjectOfTicketListResponse, PageObjectOfMessageResponse, MessageResponse as WireMessageResponse, AttachmentResponse as WireAttachmentResponse } from './generated/models';
import type { PagedTicketList } from '@/types/ticket';
import type { Message, MessageAttachment, PagedMessages } from '@/types/message';

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export function requireData<T>(response: Envelope<T>): T {
  if (response.success === false || response.data == null) {
    throw new Error(response.message || 'API response is missing data');
  }
  return response.data;
}

export function ticketPage(wire: PageObjectOfTicketListResponse): PagedTicketList {
  return {
    content: (wire.content ?? []) as PagedTicketList['content'],
    page: {
      number: wire.number ?? 0,
      size: wire.size ?? 0,
      totalElements: wire.totalElements ?? 0,
      totalPages: wire.totalPages ?? 0,
    },
  };
}

export function messagePage(wire: PageObjectOfMessageResponse): PagedMessages {
  return {
    content: (wire.content ?? []).map(messageView),
    number: wire.number ?? 0,
    size: wire.size ?? 0,
    totalElements: wire.totalElements ?? 0,
    totalPages: wire.totalPages ?? 0,
    first: wire.first ?? false,
    last: wire.last ?? false,
  };
}

function messageAttachmentView(wire: WireAttachmentResponse): MessageAttachment {
  if (wire.id == null || wire.filename == null || wire.url == null || wire.fileSize == null ||
      wire.mimeType == null || wire.type == null) {
    throw new Error('Message attachment response is missing required data');
  }
  return {
    id: wire.id,
    filename: wire.filename,
    url: wire.url,
    fileSize: wire.fileSize,
    mimeType: wire.mimeType,
    type: wire.type,
  };
}

export function messageView(wire: WireMessageResponse): Message {
  if (wire.id == null || wire.ticketId == null ||
      wire.senderType == null || wire.createdAt == null || wire.updatedAt == null) {
    throw new Error('Message response is missing required data');
  }
  return {
    id: wire.id,
    ticketId: wire.ticketId,
    content: wire.content ?? '',
    sender: messageSenderView(wire.sender),
    senderType: wire.senderType,
    internal: wire.internal ?? false,
    readByUser: wire.readByUser ?? false,
    readBySpecialist: wire.readBySpecialist ?? false,
    edited: wire.edited ?? false,
    attachments: (wire.attachments ?? []).map(messageAttachmentView),
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  };
}

function messageSenderView(sender: WireMessageResponse['sender']): Message['sender'] {
  if (sender == null) {
    return { id: 0, username: 'unknown', fio: null, avatarUrl: null, isSpecialist: false };
  }
  if (sender.id == null || sender.username == null) {
    throw new Error('Message response is missing required data');
  }
  return {
    id: sender.id,
    username: sender.username,
    fio: sender.fio ?? null,
    avatarUrl: sender.avatarUrl ?? null,
    isSpecialist: sender.isSpecialist ?? false,
    ...(sender.color == null ? {} : { color: sender.color }),
  };
}
