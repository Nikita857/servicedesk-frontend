import api from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  AgentConversation,
  AgentFile,
  AgentMessageDto,
} from "@/types/agent";

/**
 * CRUD-часть ИИ-агента. Стриминг ответа живёт отдельно, в ./agentStream —
 * axios в браузере работает поверх XHR и потоковое тело не отдаёт.
 */
export const agentApi = {
  createConversation: async (title?: string): Promise<AgentConversation> => {
    const response = await api.post<ApiResponse<AgentConversation>>(
      "/agent/conversations",
      { title: title ?? null },
    );
    return response.data.data;
  },

  /**
   * Пока не используется в UI: виджет ведёт один постоянный диалог.
   * Нужен для будущего управления списком чатов.
   */
  listConversations: async (
    page = 0,
    size = 20,
  ): Promise<PaginatedResponse<AgentConversation>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<AgentConversation>>
    >("/agent/conversations", {
      params: { page, size, sort: "updatedAt,desc" },
    });
    return response.data.data;
  },

  getConversation: async (id: number): Promise<AgentConversation> => {
    const response = await api.get<ApiResponse<AgentConversation>>(
      `/agent/conversations/${id}`,
    );
    return response.data.data;
  },

  /** Тем же эндпоинтом пользуется и MCP-тул set_conversation_title. */
  updateTitle: async (id: number, title: string): Promise<AgentConversation> => {
    const response = await api.patch<ApiResponse<AgentConversation>>(
      `/agent/conversations/${id}/title`,
      { title },
    );
    return response.data.data;
  },

  listMessages: async (
    id: number,
    page = 0,
    size = 50,
    direction: "asc" | "desc" = "asc",
  ): Promise<PaginatedResponse<AgentMessageDto>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<AgentMessageDto>>
    >(`/agent/conversations/${id}/messages`, {
      params: { page, size, sort: `createdAt,${direction}` },
    });
    return response.data.data;
  },

  /**
   * Отмена генерации. На бэке она кооперативная: выставляется флаг, который
   * гейтвей проверяет перед следующим событием. Возвращает false, если
   * активного стрима нет.
   */
  cancel: async (id: number): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>(
      `/agent/conversations/${id}/cancel`,
    );
    return response.data.data;
  },

  /**
   * Загружает бланк (.docx/.xlsx) в диалог. Делается ДО отправки сообщения: id из
   * ответа уходит в fileIds, а бэкенд дописывает его в промпт служебной строкой,
   * по которой агент вызывает свои инструменты работы с документами.
   */
  uploadFile: async (conversationId: number, file: File): Promise<AgentFile> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<AgentFile>>(
      `/agent/conversations/${conversationId}/files`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  },

  /** Софт-делит диалог и все его сообщения (каскад — на бэке, одной транзакцией). */
  deleteConversation: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/agent/conversations/${id}`);
  },

  /** Софт-делит одно сообщение. Бэк проверяет, что оно из указанного диалога. */
  deleteMessage: async (
    conversationId: number,
    messageId: number,
  ): Promise<void> => {
    await api.delete<ApiResponse<void>>(
      `/agent/conversations/${conversationId}/messages/${messageId}`,
    );
  },
};
