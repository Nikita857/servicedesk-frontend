import axios, { AxiosError } from "axios";
import { toast } from "./toast";

/**
 * Интерфейс стандартного ответа об ошибке от бэкенда
 */
interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  path?: string;
  timestamp?: string;
}

/**
 * Опции для обработки ошибок
 */
interface HandleApiErrorOptions {
  /** Контекст операции для fallback сообщения */
  context?: string;
  /** Не показывать toast (для кастомной обработки) */
  silent?: boolean;
  /** Кастомные обработчики по статус-коду */
  handlers?: Partial<Record<number, (error: AxiosError<ApiErrorResponse>) => void>>;
}

/**
 * Извлечь сообщение об ошибке из ответа API
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    
    // Приоритет: message > error > status text
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.response?.statusText) return error.response.statusText;
    if (error.message) return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Неизвестная ошибка";
}

/**
 * Получить HTTP статус код из ошибки
 */
export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status;
  }
  return null;
}

/**
 * Централизованная обработка ошибок API
 * 
 * @example
 * try {
 *   await ticketApi.create(data);
 * } catch (error) {
 *   handleApiError(error, { context: "создать тикет" });
 * }
 */
export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions = {}
): void {
  const { context, silent = false, handlers = {} } = options;
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  // Вызвать кастомный обработчик если есть
  if (status && handlers[status] && axios.isAxiosError(error)) {
    handlers[status](error);
    return;
  }

  // Не показывать toast в silent режиме
  if (silent) return;

  // Обработка стандартных статусов
  switch (status) {
    case 400:
      toast.error("Ошибка валидации", message);
      break;
    case 401:
      toast.error("Не авторизован", "Войдите в систему");
      break;
    case 403:
      toast.error("Доступ запрещён", message || "Недостаточно прав");
      break;
    case 404:
      toast.error("Не найдено", message || "Ресурс не существует");
      break;
    case 409:
      toast.error("Конфликт", message);
      break;
    case 422:
      toast.error("Ошибка данных", message);
      break;
    case 500:
    case 502:
    case 503:
      toast.error("Ошибка сервера", "Попробуйте позже");
      break;
    default:
      // Fallback с контекстом
      if (context) {
        toast.error("Ошибка", `Не удалось ${context}`);
      } else {
        toast.error("Ошибка", message);
      }
  }
}

/**
 * Обёртка для async функций с автоматической обработкой ошибок
 * 
 * @example
 * const result = await withErrorHandling(
 *   () => ticketApi.create(data),
 *   { context: "создать тикет" }
 * );
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: HandleApiErrorOptions = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, options);
    return null;
  }
}

/**
 * Проверить, является ли ошибка определённым статусом
 */
export function isStatus(error: unknown, status: number): boolean {
  return getErrorStatus(error) === status;
}

/**
 * Проверить, является ли ошибка ошибкой сети
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response && error.code === "ERR_NETWORK";
  }
  return false;
}
