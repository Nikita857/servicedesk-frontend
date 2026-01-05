"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import { useWebSocket } from "@/lib/providers";
import type { Message, MessageAttachment } from "@/types/message";
import type { SenderType } from "@/types/message";
import type {
  ChatMessageWS,
  TypingIndicator,
  AttachmentWS,
} from "@/types/websocket";

interface TypingUser {
  fio: string | null;
  username: string;
}

interface UseChatWebSocketReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  isConnected: boolean;
  typingUser: TypingUser | null;
  sendTypingIndicator: (typing: boolean) => void;
  sendMessage: (content: string, internal?: boolean) => boolean;
  fetchMessages: () => Promise<void>;
}

/**
 * Хук для управления чатом тикета через WebSocket
 * Использует централизованный WebSocketProvider
 */
export function useChatWebSocket(ticketId: number): UseChatWebSocketReturn {
  const { user } = useAuthStore();
  const {
    isConnected,
    subscribeToChatMessages,
    subscribeToInternalComments,
    subscribeToTyping,
    subscribeToAttachments,
    sendMessage: wsSendMessage,
    sendTyping,
  } = useWebSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Буфер для вложений, которые пришли раньше своих сообщений
  const pendingAttachmentsRef = useRef<Map<number, MessageAttachment[]>>(
    new Map()
  );
  // Храним таймауты для очистки осиротевших вложений
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastTypingSentRef = useRef<number>(0);

  // Получение начальных сообщений
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      await messageApi.markAsRead(ticketId);
    } catch (error) {
      console.error("Не удалось загрузить сообщения", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  // Отправка индикатора печати (с задержкой)
  const sendTypingIndicator = useCallback(
    (typing: boolean) => {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1000 || !typing) {
        sendTyping(ticketId, typing);
        lastTypingSentRef.current = now;
      }
    },
    [ticketId, sendTyping]
  );

  // Отправка сообщения через WebSocket
  const sendMessage = useCallback(
    (content: string, internal = false): boolean => {
      return wsSendMessage(ticketId, content, internal);
    },
    [ticketId, wsSendMessage]
  );

  // Получаем сообщения при монтировании
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Обработка входящего сообщения (обычное и внутреннее)
  const handleIncomingMessage = useCallback((wsMessage: ChatMessageWS) => {
    console.log("[WS] Входящее сообщение (payload):", wsMessage);

    // Формируем отправителя, если не хватает данных (плоская структура vs вложенная)
    const sender = wsMessage.sender || {
      id: wsMessage.senderId!,
      username: wsMessage.senderUsername || "unknown",
      fio: wsMessage.senderFio || null,
      avatarUrl: null,
    };

    // Хелпер для конвертации вложений из WS в тип MessageAttachment
    const convertWsAttachments = (
      wsAttachments?: AttachmentWS[]
    ): MessageAttachment[] | undefined => {
      if (!wsAttachments || wsAttachments.length === 0) return undefined;
      return wsAttachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        type: att.type,
      }));
    };

    const newMsg: Message = {
      id: wsMessage.id,
      ticketId: wsMessage.ticketId,
      content: wsMessage.content,
      sender: sender,
      senderType: wsMessage.senderType as SenderType,
      internal: wsMessage.internal,
      readByUser: false,
      readBySpecialist: false,
      edited: false,
      createdAt: wsMessage.createdAt,
      updatedAt: wsMessage.createdAt,
      attachments: convertWsAttachments(wsMessage.attachments),
    };

    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === newMsg.id);

      // Если сообщение уже существует, обновляем его (например, могли прийти вложения)
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existingMsg = updated[existingIndex];

        // Объединение вложений: используем новые, если есть
        const newAttachments = newMsg.attachments;
        const existingAttachments = existingMsg.attachments;

        // Стратегия:
        // Если пришедшее сообщение имеет вложения - используем их.
        // Если нет - оставляем старые (чтобы не затереть оптимистично добавленные).

        if (newAttachments && newAttachments.length > 0) {
          updated[existingIndex] = {
            ...existingMsg,
            ...newMsg,
            attachments: newAttachments,
          };
        } else {
          // Оставляем существующие
          updated[existingIndex] = {
            ...existingMsg,
            ...newMsg,
            attachments: existingAttachments || [],
          };
        }

        return updated;
      }

      // Проверяем, есть ли буферизированные вложения для этого НОВОГО сообщения
      const pendingAttachments = pendingAttachmentsRef.current.get(newMsg.id);
      if (pendingAttachments) {
        // Дедупликация: добавляем только те, которых ещё нет
        const existingIds = new Set(
          (newMsg.attachments || []).map((a) => a.id)
        );
        const uniquePending = pendingAttachments.filter(
          (a) => !existingIds.has(a.id)
        );
        newMsg.attachments = [...(newMsg.attachments || []), ...uniquePending];
        pendingAttachmentsRef.current.delete(newMsg.id);

        // Очищаем таймаут очистки
        const timeoutId = pendingTimeoutsRef.current.get(newMsg.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingTimeoutsRef.current.delete(newMsg.id);
        }
      }

      return [...prev, newMsg];
    });
  }, []);

  // Подписка на сообщения и внутренние комментарии
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToChatMessages(
      ticketId,
      handleIncomingMessage
    );
    const unsubscribeInternal = subscribeToInternalComments(
      ticketId,
      handleIncomingMessage
    );

    return () => {
      unsubscribeMessages();
      unsubscribeInternal();
    };
  }, [
    isConnected,
    ticketId,
    subscribeToChatMessages,
    subscribeToInternalComments,
    handleIncomingMessage,
  ]);

  // Подписка на индикатор набора текста
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToTyping(
      ticketId,
      (indicator: TypingIndicator) => {
        if (indicator.userId === user?.id) return;

        if (indicator.typing) {
          setTypingUser({ fio: indicator.fio, username: indicator.username });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setTypingUser(null),
            3000
          );
        } else {
          setTypingUser(null);
        }
      }
    );

    return unsubscribe;
  }, [isConnected, ticketId, subscribeToTyping, user?.id]);

  // Подписка на вложения
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToAttachments(
      ticketId,
      (attachment: AttachmentWS) => {
        console.log("[WS] Получено событие вложения:", attachment);

        // Конвертация AttachmentWS в MessageAttachment
        const newAttachment: MessageAttachment = {
          id: attachment.id,
          filename: attachment.filename,
          url: attachment.url,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          type: attachment.type,
        };

        const messageId = attachment.messageId;
        if (messageId !== null && messageId !== undefined) {
          setMessages((prev) => {
            const messageExists = prev.some((m) => m.id === messageId);

            if (!messageExists) {
              console.log(
                `[WS] Сообщение ${messageId} для вложения не найдено локально. Буферизируем.`
              );
              // Сообщение еще не пришло, буферизируем вложение
              const existing =
                pendingAttachmentsRef.current.get(messageId) || [];
              pendingAttachmentsRef.current.set(messageId, [
                ...existing,
                newAttachment,
              ]);

              // Устанавливаем таймаут очистки (60 секунд) чтобы избежать утечек памяти
              // Если сообщение не придет за 60 сек, удаляем буфер
              if (!pendingTimeoutsRef.current.has(messageId)) {
                const timeoutId = setTimeout(() => {
                  pendingAttachmentsRef.current.delete(messageId);
                  pendingTimeoutsRef.current.delete(messageId);
                  console.warn(
                    `Очищены осиротевшие вложения для сообщения ${messageId}`
                  );
                }, 60000);
                pendingTimeoutsRef.current.set(messageId, timeoutId);
              }

              return prev;
            }

            console.log(
              `[WS] Сообщение ${messageId} найдено. Обновляем вложения.`
            );
            return prev.map((msg) => {
              if (msg.id !== messageId) return msg;

              // Проверяем, есть ли уже такое вложение (по id)
              const existingIds = new Set(
                (msg.attachments || []).map((a) => a.id)
              );
              if (existingIds.has(newAttachment.id)) {
                console.log(
                  `[WS] Вложение ${newAttachment.id} уже существует, пропускаем`
                );
                return msg;
              }

              return {
                ...msg,
                attachments: [...(msg.attachments || []), newAttachment],
              };
            });
          });

          // Принудительное обновление сообщений для гарантии консистентности (fail-safe)
          // Добавляем задержку, чтобы транзакция на бэке успела закоммититься
          setTimeout(() => {
            console.log(
              "[WS] Принудительное обновление сообщений после события вложения"
            );
            fetchMessages();
          }, 1000);
        }
      }
    );

    return unsubscribe;
  }, [isConnected, ticketId, subscribeToAttachments]);

  return {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
    sendMessage,
    fetchMessages,
  };
}
