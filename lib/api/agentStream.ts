import { API_BASE_URL } from "../config";
import { refreshAccessToken } from "./client";
import type {
  AgentCancelledEvent,
  AgentDeltaEvent,
  AgentDoneEvent,
  AgentErrorEvent,
} from "@/types/agent";

/**
 * Стриминг ответа ИИ-агента.
 *
 * Почему не axios: в браузере он работает поверх XHR и потоковое тело не отдаёт —
 * колбэки пришли бы только после закрытия соединения. Нужен нативный fetch + getReader().
 *
 * Почему не EventSource: он умеет только GET и не отправляет заголовки, а нам нужен
 * POST с телом и CSRF-токеном.
 *
 * Цена решения: интерцепторы axios в обход, поэтому CSRF и рефреш токена
 * приходится повторять здесь руками (см. lib/api/client.ts).
 */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Тот же трюк, что в request-интерцепторе client.ts: если CSRF-куки нет
 * (браузер счёл её сессионной и сбросил) — дёргаем лёгкий эндпоинт, чтобы бэк её выставил.
 */
async function ensureCsrfToken(): Promise<string | null> {
  let token = getCookie("XSRF-TOKEN");
  if (!token) {
    try {
      await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
      token = getCookie("XSRF-TOKEN");
    } catch {
      /* offline — падать здесь смысла нет, ошибку отдаст основной запрос */
    }
  }
  return token;
}

export interface AgentStreamCallbacks {
  onDelta: (chunk: string) => void;
  onDone: (event: AgentDoneEvent) => void;
  onError: (event: AgentErrorEvent) => void;
  onCancelled: (event: AgentCancelledEvent) => void;
}

export interface AgentStreamOptions extends AgentStreamCallbacks {
  conversationId: number;
  content: string;
  /** Id уже загруженных бланков (POST /agent/conversations/{id}/files). */
  fileIds?: number[];
  signal: AbortSignal;
}

/** Разбирает распарсенный SSE-кадр и раскидывает по колбэкам. */
function dispatchFrame(
  eventName: string,
  data: string,
  cb: AgentStreamCallbacks,
): void {
  if (!data) return;

  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    console.warn("[Agent] не удалось разобрать SSE-кадр:", eventName, data);
    return;
  }

  switch (eventName) {
    case "delta":
      cb.onDelta((payload as AgentDeltaEvent).delta ?? "");
      break;
    case "done":
      cb.onDone(payload as AgentDoneEvent);
      break;
    case "error":
      cb.onError(payload as AgentErrorEvent);
      break;
    case "cancelled":
      cb.onCancelled(payload as AgentCancelledEvent);
      break;
    default:
      // Неизвестное событие — бэкенд мог добавить новое, молча игнорируем
      break;
  }
}

/**
 * Разбирает ошибку, пришедшую ДО открытия стрима.
 * Это обычный JSON с реальным HTTP-кодом, а не SSE — второй канал ошибок.
 */
async function readPreStreamError(response: Response): Promise<AgentErrorEvent> {
  let message = "Не удалось связаться с ИИ-агентом";
  try {
    const body = await response.json();
    if (typeof body?.message === "string" && body.message) {
      message = body.message;
    }
  } catch {
    /* тело не JSON — оставляем дефолт */
  }

  if (response.status === 403) {
    message = message || "Нет доступа к ИИ-агенту";
  }
  return { code: `HTTP_${response.status}`, message, errorId: null };
}

async function postMessage(
  conversationId: number,
  content: string,
  fileIds: number[] | undefined,
  signal: AbortSignal,
): Promise<Response> {
  const csrfToken = await ensureCsrfToken();
  return fetch(`${API_BASE_URL}/agent/conversations/${conversationId}/messages`, {
    method: "POST",
    credentials: "include",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
    },
    body: JSON.stringify({
      content,
      fileIds: fileIds?.length ? fileIds : null,
    }),
  });
}

export async function streamAgentMessage(
  options: AgentStreamOptions,
): Promise<void> {
  const { conversationId, content, fileIds, signal, ...callbacks } = options;

  try {
    let response = await postMessage(conversationId, content, fileIds, signal);

    // Стрим живёт до 120с и может пережить access-токен. AuthRefresh обновляет
    // его раз в 30с, но гонку это не исключает — даём один шанс на рефреш+ретрай.
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await postMessage(conversationId, content, fileIds, signal);
      }
    }

    if (!response.ok) {
      callbacks.onError(await readPreStreamError(response));
      return;
    }

    if (!response.body) {
      callbacks.onError({
        code: "NO_STREAM",
        message: "Браузер не поддерживает потоковые ответы",
        errorId: null,
      });
      return;
    }

    await readSseStream(response.body, callbacks);
  } catch (error) {
    // Отмену инициировали мы сами через AbortController — это не ошибка
    if (signal.aborted || (error as Error)?.name === "AbortError") return;

    console.error("[Agent] сбой стрима:", error);
    callbacks.onError({
      code: "NETWORK_ERROR",
      message: "Соединение с ИИ-агентом прервано",
      errorId: null,
    });
  }
}

/**
 * Минимальный парсер SSE поверх ReadableStream.
 * Кадры разделены пустой строкой; строки `data:` внутри кадра склеиваются через \n
 * (Spring обычно шлёт одну, но JSON с переносами формально допустим).
 */
async function readSseStream(
  body: ReadableStream<Uint8Array>,
  callbacks: AgentStreamCallbacks,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushFrame = (rawFrame: string) => {
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of rawFrame.split("\n")) {
      if (!line || line.startsWith(":")) continue; // пустая строка или комментарий-keepalive
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      // по спецификации SSE один пробел после двоеточия отбрасывается
      let value = colon === -1 ? "" : line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);

      if (field === "event") eventName = value;
      else if (field === "data") dataLines.push(value);
    }

    dispatchFrame(eventName, dataLines.join("\n"), callbacks);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let separator: number;
      while ((separator = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        flushFrame(frame);
      }
      // хвост без завершающей пустой строки остаётся в буфере до следующего чтения
    }

    // Бэкенд закрывает соединение сразу после done/error/cancelled,
    // но если последний кадр остался без разделителя — дочитываем его
    const tail = (buffer + decoder.decode()).trim();
    if (tail) flushFrame(tail);
  } finally {
    reader.releaseLock();
  }
}
