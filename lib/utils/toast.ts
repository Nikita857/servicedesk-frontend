import { toaster } from "@/components/ui/toaster";

/**
 * Централизованные хелперы для toast уведомлений
 * Все тосты автоматически closable
 */
export const toast = {
  /**
   * Успешное уведомление (зелёное)
   */
  success: (title: string, description?: string) => {
    toaster.success({
      title,
      description,
      duration: 4000,
      meta: { closable: true },
    });
  },

  /**
   * Уведомление об ошибке (красное)
   */
  error: (title: string, description?: string) => {
    toaster.error({
      title,
      description,
      duration: 6000,
      meta: { closable: true },
    });
  },

  /**
   * Информационное уведомление (синее)
   */
  info: (title: string, description?: string) => {
    toaster.info({
      title,
      description,
      duration: 4000,
      meta: { closable: true },
    });
  },

  /**
   * Предупреждение (оранжевое)
   */
  warning: (title: string, description?: string) => {
    toaster.warning({
      title,
      description,
      duration: 5000,
      meta: { closable: true },
    });
  },

  /**
   * Тост для загрузки (с промисом)
   */
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ): Promise<T> => {
    toaster.promise(promise, {
      loading: { title: options.loading },
      success: (data) => ({
        title: typeof options.success === "function" ? options.success(data) : options.success,
        meta: { closable: true },
      }),
      error: (err) => ({
        title: typeof options.error === "function" ? options.error(err) : options.error,
        meta: { closable: true },
      }),
    });
    return promise;
  },

  // ==================== Предустановленные сообщения ====================

  /**
   * Тикет обновлён
   */
  ticketUpdated: (ticketId: number, message: string) => {
    toast.info(`Тикет #${ticketId}`, message);
  },

  /**
   * Новый тикет
   */
  newTicket: (ticketId: number, title: string) => {
    toast.info(`Новый тикет #${ticketId}`, title);
  },

  /**
   * Операция выполнена
   */
  saved: () => {
    toast.success("Сохранено");
  },

  /**
   * Удалено
   */
  deleted: () => {
    toast.success("Удалено");
  },

  /**
   * Скопировано в буфер
   */
  copied: () => {
    toast.success("Скопировано в буфер обмена");
  },

  /**
   * Ошибка загрузки
   */
  loadError: (entity: string = "данные") => {
    toast.error("Ошибка загрузки", `Не удалось загрузить ${entity}`);
  },

  /**
   * Ошибка сохранения
   */
  saveError: () => {
    toast.error("Ошибка", "Не удалось сохранить изменения");
  },

  /**
   * Ошибка удаления
   */
  deleteError: () => {
    toast.error("Ошибка", "Не удалось удалить");
  },
};
