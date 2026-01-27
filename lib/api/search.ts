import api from "./client";
import type { ApiResponse } from "@/types/api";

export const searchAdminApi = {
  /**
   * Полная переиндексация всех сущностей (Wiki, Тикеты и т.д.)
   */
  reindexAll: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/admin/search/reindex");
  },

  /**
   * Переиндексация только статей Wiki
   */
  reindexWiki: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/admin/search/reindex/wiki");
  },

  /**
   * Переиндексация только тикетов
   */
  reindexTickets: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/admin/search/reindex/tickets");
  },
};
