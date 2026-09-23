import type { PageObjectOfTicketListResponse, PageObjectOfMessageResponse } from './generated/models';
import type { PagedTicketList } from '@/types/ticket';
import type { PagedMessages } from '@/types/message';

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
    content: (wire.content ?? []) as PagedMessages['content'],
    number: wire.number ?? 0,
    size: wire.size ?? 0,
    totalElements: wire.totalElements ?? 0,
    totalPages: wire.totalPages ?? 0,
    first: wire.first ?? false,
    last: wire.last ?? false,
  };
}
