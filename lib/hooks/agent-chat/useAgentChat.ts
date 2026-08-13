"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { agentApi } from "@/lib/api/agent";
import { streamAgentMessage } from "@/lib/api/agentStream";
import { useAgentChatStore } from "@/stores/agentChatStore";
import { toast } from "@/lib/utils";
import type {
  AgentChatStatus,
  AgentFile,
  AgentMessageDto,
  AgentUiMessage,
} from "@/types/agent";

/**
 * Текст ошибки от бэкенда: валидация файла (формат, размер, битое содержимое)
 * приходит понятным сообщением, и показать его полезнее, чем общую фразу.
 */
function extractApiMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" && message ? message : null;
}

/**
 * crypto.randomUUID() существует только в secure context (HTTPS или localhost).
 * Если фронт отдаётся по обычному HTTP — его нет, поэтому нужен фолбэк.
 * Id живёт только на клиенте и на уникальность в БД не влияет.
 */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** История с бэка → сообщение виджета. Роль обязательно в нижний регистр. */
function toUiMessage(dto: AgentMessageDto): AgentUiMessage {
  return {
    id: String(dto.id),
    role: dto.role === "ASSISTANT" ? "assistant" : "user",
    content: dto.content,
  };
}

/** Заменяет текст конкретного сообщения, не трогая остальные. */
function patchContent(
  messages: AgentUiMessage[],
  id: string,
  content: string,
): AgentUiMessage[] {
  return messages.map((message) =>
    message.id === id ? { ...message, content } : message,
  );
}

export interface UseAgentChatResult {
  messages: AgentUiMessage[];
  status: AgentChatStatus;
  /** Идёт запрос или стрим — по этому флагу кнопка отправки становится «стоп». */
  isLoading: boolean;
  isHistoryLoading: boolean;
  /** attachments — бланки Word/Excel; они загружаются на бэк перед отправкой сообщения. */
  sendMessage: (text: string, attachments?: File[]) => Promise<void>;
  stop: () => Promise<void>;
  loadHistory: () => Promise<void>;
  resetConversation: () => Promise<void>;
  /** Переключает виджет на другой существующий диалог (например, выбор в сайдбаре) и грузит его историю. */
  switchConversation: (id: number) => Promise<void>;
  /** Удаляет одно сообщение. Молча игнорирует ещё не сохранённые на бэке (см. isPersistedMessageId). */
  deleteMessage: (id: string) => Promise<void>;
  /** Удаляет весь текущий диалог на бэке и сбрасывает локальный стейт виджета. */
  deleteConversation: () => Promise<void>;
  /** Название текущего диалога (null, пока диалог не создан или ещё не назван). */
  title: string | null;
  /** Ручное переименование — тем же эндпоинтом, что и MCP-тул set_conversation_title. */
  renameConversation: (title: string) => Promise<void>;
}

/**
 * У сообщений из истории (loadHistory) id — реальный id из БД (число в строке).
 * У сообщений, отправленных в текущей сессии (sendMessage), id — клиентский
 * UUID/фолбэк из randomId(): бэк не возвращает id сохранённого сообщения ни в
 * одном SSE-событии, поэтому до перезагрузки истории удалить их нечем — нет
 * настоящего id, который можно было бы отправить в DELETE-запрос.
 */
export function isPersistedMessageId(id: string): boolean {
  return /^\d+$/.test(id);
}

/**
 * Состояние чата с ИИ-агентом поверх бэкенда feature/agent.
 * Транспорт — SSE, см. lib/api/agentStream.ts.
 */
export function useAgentChat(): UseAgentChatResult {
  const [messages, setMessages] = useState<AgentUiMessage[]>([]);
  const [status, setStatus] = useState<AgentChatStatus>("ready");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  const { conversationId, setConversationId } = useAgentChatStore();

  const abortRef = useRef<AbortController | null>(null);
  // Держим id в ref, чтобы sendMessage не пересоздавался и не тянул устаревшее значение
  const conversationIdRef = useRef<number | null>(conversationId);
  const historyLoadedFor = useRef<number | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Обрываем стрим при размонтировании, чтобы не писать в отсутствующий стейт
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /** Диалог создаётся лениво — при первом сообщении, а не при открытии виджета. */
  const ensureConversation = useCallback(async (): Promise<number> => {
    if (conversationIdRef.current !== null) return conversationIdRef.current;

    const conversation = await agentApi.createConversation();
    conversationIdRef.current = conversation.id;
    setConversationId(conversation.id);
    setTitle(conversation.title);
    historyLoadedFor.current = conversation.id;
    return conversation.id;
  }, [setConversationId]);

  const loadHistory = useCallback(async () => {
    const id = conversationIdRef.current;
    if (id === null || historyLoadedFor.current === id) return;

    setIsHistoryLoading(true);
    try {
      // Тред постоянный и со временем растёт, поэтому берём ПОСЛЕДНИЕ 50 сообщений
      // (сортировка по убыванию + разворот), а не первые. Контекст для LLM это не
      // ломает: он живёт на стороне Yandex через previousResponseId, локальная
      // история нужна только для отображения.
      const [conversation, page] = await Promise.all([
        agentApi.getConversation(id),
        agentApi.listMessages(id, 0, 50, "desc"),
      ]);
      setTitle(conversation.title);
      setMessages(page.content.map(toUiMessage).reverse());
      historyLoadedFor.current = id;
    } catch (error) {
      // Диалог мог быть удалён из БД — начинаем с чистого листа, а не падаем
      console.error("[Agent] не удалось загрузить историю:", error);
      conversationIdRef.current = null;
      setConversationId(null);
      setMessages([]);
      setTitle(null);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [setConversationId]);

  const sendMessage = useCallback(
    async (text: string, attachments: File[] = []): Promise<void> => {
      const content = text.trim();
      if (!content) return;

      const localMessageId = randomId();
      setMessages((prev) => [
        ...prev,
        { id: localMessageId, role: "user", content },
      ]);
      setStatus("submitted");

      let id: number;
      try {
        // Диалог нужен раньше файлов: они загружаются в него, а не «в никуда».
        id = await ensureConversation();
      } catch (error) {
        console.error("[Agent] не удалось создать диалог:", error);
        setStatus("error");
        toast.error("ИИ-агент недоступен", "Не удалось создать диалог");
        return;
      }

      let uploaded: AgentFile[] = [];
      if (attachments.length > 0) {
        try {
          // Последовательно, а не Promise.all: файлы крупные, а бэкенд пишет их
          // в MinIO — параллельная заливка трёх бланков ничего не ускоряет.
          for (const file of attachments) {
            uploaded = [...uploaded, await agentApi.uploadFile(id, file)];
          }
          setMessages((prev) =>
            prev.map((message) =>
              message.id === localMessageId
                ? { ...message, files: uploaded }
                : message,
            ),
          );
        } catch (error) {
          console.error("[Agent] не удалось загрузить файл:", error);
          setStatus("error");
          toast.error(
            "Файл не загружен",
            extractApiMessage(error) ??
              "Проверьте формат (.docx или .xlsx) и размер файла",
          );
          return;
        }
      }

      const controller = new AbortController();
      abortRef.current = controller;

      // Id ассистентского сообщения выпускаем заранее, а само сообщение создаём
      // на первом токене: пока его нет, виджет показывает индикатор «думает»
      const assistantId = randomId();
      let accumulated = "";

      const appendDelta = (chunk: string) => {
        if (!chunk) return;
        const isFirstChunk = accumulated === "";
        accumulated += chunk;

        if (isFirstChunk) {
          setStatus("streaming");
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: accumulated },
          ]);
        } else {
          setMessages((prev) => patchContent(prev, assistantId, accumulated));
        }
      };

      await streamAgentMessage({
        conversationId: id,
        content,
        fileIds: uploaded.map((file) => file.id),
        signal: controller.signal,
        onDelta: appendDelta,
        onDone: (event) => {
          // event.message — ПОЛНЫЙ текст ответа, а не статус. Берём его только если
          // дельт не было вовсе, иначе ответ задвоится.
          if (accumulated === "" && event.message) {
            appendDelta(event.message);
          }
          setStatus("ready");
        },
        onCancelled: () => {
          setStatus("ready");
        },
        onError: (event) => {
          setStatus("error");
          // Черновик ответа, если он успел появиться, оставляем на экране
          toast.error("ИИ-агент", event.message);
          if (event.errorId) {
            console.error(`[Agent] errorId=${event.errorId}`, event.code);
          }
        },
      });

      abortRef.current = null;
    },
    [ensureConversation],
  );

  /**
   * Остановка — два действия: рвём локальный fetch и просим бэк прекратить генерацию.
   * Без второго запроса LLM продолжит работать: отмена на бэке кооперативная.
   */
  const stop = useCallback(async (): Promise<void> => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");

    const id = conversationIdRef.current;
    if (id === null) return;
    try {
      await agentApi.cancel(id);
    } catch (error) {
      console.error("[Agent] не удалось отменить генерацию:", error);
    }
  }, []);

  const resetConversation = useCallback(async (): Promise<void> => {
    abortRef.current?.abort();
    abortRef.current = null;
    conversationIdRef.current = null;
    historyLoadedFor.current = null;
    setConversationId(null);
    setMessages([]);
    setStatus("ready");
    setTitle(null);
  }, [setConversationId]);

  /** Выбор диалога из сайдбара. Обрывает текущий стрим и форсирует перезагрузку истории. */
  const switchConversation = useCallback(
    async (id: number): Promise<void> => {
      if (id === conversationIdRef.current) return;

      abortRef.current?.abort();
      abortRef.current = null;
      conversationIdRef.current = id;
      historyLoadedFor.current = null;
      setConversationId(id);
      setMessages([]);
      setStatus("ready");
      setTitle(null);
      await loadHistory();
    },
    [setConversationId, loadHistory],
  );

  const renameConversation = useCallback(async (nextTitle: string): Promise<void> => {
    const id = conversationIdRef.current;
    const trimmed = nextTitle.trim();
    if (id === null || !trimmed) return;

    try {
      const conversation = await agentApi.updateTitle(id, trimmed);
      setTitle(conversation.title);
    } catch (error) {
      console.error("[Agent] не удалось переименовать диалог:", error);
      toast.error("ИИ-агент", "Не удалось переименовать диалог");
    }
  }, []);

  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    const conversationIdValue = conversationIdRef.current;
    if (conversationIdValue === null || !isPersistedMessageId(id)) {
      console.warn(
        "[Agent] сообщение ещё не сохранено на бэке, удалить нельзя:",
        id,
      );
      return;
    }

    try {
      await agentApi.deleteMessage(conversationIdValue, Number(id));
      setMessages((prev) => prev.filter((message) => message.id !== id));
    } catch (error) {
      console.error("[Agent] не удалось удалить сообщение:", error);
      toast.error("ИИ-агент", "Не удалось удалить сообщение");
    }
  }, []);

  const deleteConversation = useCallback(async (): Promise<void> => {
    const id = conversationIdRef.current;
    if (id === null) return;

    abortRef.current?.abort();
    abortRef.current = null;

    try {
      // Гасим активную генерацию, если она идёт — иначе ответ дописался бы
      // в уже удалённый диалог. Кооперативная отмена, best-effort.
      await agentApi.cancel(id);
    } catch (error) {
      console.error("[Agent] не удалось отменить генерацию перед удалением:", error);
    }

    try {
      await agentApi.deleteConversation(id);
    } catch (error) {
      console.error("[Agent] не удалось удалить диалог:", error);
      toast.error("ИИ-агент", "Не удалось удалить диалог");
      return;
    }

    conversationIdRef.current = null;
    historyLoadedFor.current = null;
    setConversationId(null);
    setMessages([]);
    setStatus("ready");
    setTitle(null);
  }, [setConversationId]);

  return {
    messages,
    status,
    isLoading: status === "submitted" || status === "streaming",
    isHistoryLoading,
    sendMessage,
    stop,
    loadHistory,
    resetConversation,
    switchConversation,
    deleteMessage,
    deleteConversation,
    title,
    renameConversation,
  };
}
