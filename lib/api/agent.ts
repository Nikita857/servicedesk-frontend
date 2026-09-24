import type { PaginatedResponse } from "@/types/api";
import { getServiceDeskAPI } from './generated/client';
import { toPage } from './page';
import type {
  AgentConversation,
  AgentFile,
  AgentMessageDto,
} from "@/types/agent";

/**
 * CRUD-часть ИИ-агента. Стриминг ответа живёт отдельно, в ./agentStream —
 * axios в браузере работает поверх XHR и потоковое тело не отдаёт.
 */
const generated = getServiceDeskAPI();

export const agentApi = {
  createConversation: async (title?: string): Promise<AgentConversation> => {
    return (await generated.createConversation(title ? { title } : {})).data as AgentConversation;
  },

  /**
   * Пока не используется в UI: виджет ведёт один постоянный диалог.
   * Нужен для будущего управления списком чатов.
   */
  listConversations: async (
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<AgentConversation>> => {
    return toPage((await generated.getConversations({ pageable: { page, size, sort: ['updatedAt,desc'] } })).data) as PaginatedResponse<AgentConversation>;
  },

  getConversation: async (id: number): Promise<AgentConversation> => {
    return (await generated.getConversation1(id)).data as AgentConversation;
  },

  /** Тем же эндпоинтом пользуется и MCP-тул set_conversation_title. */
  updateTitle: async (id: number, title: string): Promise<AgentConversation> => {
    return (await generated.updateTitle(id, { title })).data as AgentConversation;
  },

  listMessages: async (
    id: number,
    page = 0,
    size = 50,
    direction: "asc" | "desc" = "asc",
  ): Promise<PaginatedResponse<AgentMessageDto>> => {
    return toPage((await generated.getMessages(id, { pageable: { page, size, sort: [`createdAt,${direction}`] } })).data) as PaginatedResponse<AgentMessageDto>;
  },

  /**
   * Отмена генерации. На бэке она кооперативная: выставляется флаг, который
   * гейтвей проверяет перед следующим событием. Возвращает false, если
   * активного стрима нет.
   */
  cancel: async (id: number): Promise<boolean> => {
    return (await generated.cancelGeneration(id)).data as boolean;
  },

  /**
   * Загружает бланк (.docx/.xlsx) в диалог. Делается ДО отправки сообщения: id из
   * ответа уходит в fileIds, а бэкенд дописывает его в промпт служебной строкой,
   * по которой агент вызывает свои инструменты работы с документами.
   */
  uploadFile: async (conversationId: number, file: File): Promise<AgentFile> => {
    return (await generated.uploadFile(conversationId, { file })).data as AgentFile;
  },

  /** Софт-делит диалог и все его сообщения (каскад — на бэке, одной транзакцией). */
  deleteConversation: async (id: number): Promise<void> => {
    await generated.deleteConversation(id);
  },

  /** Софт-делит одно сообщение. Бэк проверяет, что оно из указанного диалога. */
  deleteMessage: async (
    conversationId: number,
    messageId: number,
  ): Promise<void> => {
    await generated.deleteMessage2(conversationId, messageId);
  },
};
