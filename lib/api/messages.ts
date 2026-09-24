import { getServiceDeskAPI } from './generated/client';
import { messagePage, messageView, requireData } from './ticketContractView';
import type { Message, PagedMessages, SendMessageRequest, EditMessageRequest } from '@/types/message';

const generated = getServiceDeskAPI();
export const messageApi = {
  list: async (ticketId: number, page = 0, size = 50): Promise<PagedMessages> =>
    messagePage(requireData(await generated.getTicketMessages(ticketId, { pageable: { page, size, sort: ['createdAt,desc'] } }))),
  send: async (ticketId: number, data: SendMessageRequest): Promise<Message> =>
    messageView(requireData(await generated.sendMessage(ticketId, data))),
  edit: async (messageId: number, data: EditMessageRequest): Promise<Message> =>
    messageView(requireData(await generated.editMessage(messageId, data))),
  delete: async (messageId: number): Promise<void> => { await generated.deleteMessage(messageId); },
  markAsRead: async (ticketId: number): Promise<number> => requireData(await generated.markAsRead(ticketId)),
  getUnreadCount: async (ticketId: number): Promise<number> => requireData(await generated.getUnreadCount(ticketId)),
};
