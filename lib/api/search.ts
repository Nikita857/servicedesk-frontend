import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const searchAdminApi = {
  /**
   * Полная переиндексация всех сущностей (Статьи, Заявки и т.д.)
   */
  reindexAll: async (): Promise<void> => {
    await generated.reindexAll();
  },

  /**
   * Переиндексация только статей Wiki
   */
  reindexWiki: async (): Promise<void> => {
    await generated.reindexWiki();
  },

  /**
   * Переиндексация только тикетов
   */
  reindexTickets: async (): Promise<void> => {
    await generated.reindexTickets();
  },

  /**
   * Переиндексация только опросов
   */

  reindexSurveys: async (): Promise<void> => {
    await generated.reindexSurveys();
  },
};
