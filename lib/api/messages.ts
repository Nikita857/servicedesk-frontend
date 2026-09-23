import { getServiceDeskAPI } from './generated/client';
import type { SendMessageRequest as WireSendMessageRequest, EditMessageRequest as WireEditMessageRequest } from './generated/models';
import { messagePage, requireData } from './ticketContractView';
import type { Message, PagedMessages, SendMessageRequest, EditMessageRequest } from '@/types/message';

const generated = getServiceDeskAPI();
const asMessage = (value: unknown): Message => value as Message;

export const messageApi = {
  list: async (ticketId: number, page = 0, size = 50): Promise<PagedMessages> =>
    messagePage(requireData(await generated.getTicketMessages(ticketId, { pageable: { page, size, sort: ['createdAt,desc'] } }))),
  send: async (ticketId: number, data: SendMessageRequest): Promise<Message> =>
    asMessage(requireData(await generated.sendMessage(ticketId, data as WireSendMessageRequest))),
  edit: async (messageId: number, data: EditMessageRequest): Promise<Message> =>
    asMessage(requireData(await generated.editMessage(messageId, data as WireEditMessageRequest))),
  delete: async (messageId: number): Promise<void> => { await generated.deleteMessage(messageId); },
  markAsRead: async (ticketId: number): Promise<number> => requireData(await generated.markAsRead(ticketId)),
  getUnreadCount: async (ticketId: number): Promise<number> => requireData(await generated.getUnreadCount(ticketId)),
};
