"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import { useWebSocket } from "@/lib/providers";
import type { Message, MessageAttachment } from "@/types/message";
import type {
  AttachmentWS,
  ChatMessageWS,
  ReadReceiptWS,
  TypingIndicator,
} from "@/types/websocket";
import { SenderType, Ticket } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

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
    subscribeToReadReceipts,
    sendReadReceipt,
    sendMessage: wsSendMessage,
    sendTyping,
  } = useWebSocket();

  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Буфер для вложений, которые пришли раньше своих сообщений
  const pendingAttachmentsRef = useRef<Map<number, MessageAttachment[]>>(
    new Map(),
  );
  // Храним таймауты для очистки осиротевших вложений
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastTypingSentRef = useRef<number>(0);

  // Помечаем прочитанными только если вкладка видна
  const markReadIfVisible = useCallback(() => {
    if (document.hidden) return;
    if (isConnected) {
      sendReadReceipt(ticketId);
    } else {
      messageApi.markAsRead(ticketId).catch((err) => {
        console.warn("[Chat] HTTP markAsRead fallback failed:", err);
      });
    }
  }, [ticketId, isConnected, sendReadReceipt]);

  // Получение начальных сообщений
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      markReadIfVisible();
    } catch (error) {
      console.error("Не удалось загрузить сообщения", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, markReadIfVisible]);

  // Отправка индикатора печати (с задержкой)
  const sendTypingIndicator = useCallback(
    (typing: boolean) => {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1000 || !typing) {
        sendTyping(ticketId, typing);
        lastTypingSentRef.current = now;
      }
    },
    [ticketId, sendTyping],
  );

  // Отправка сообщения через WebSocket
  const sendMessage = useCallback(
    (content: string, internal = false): boolean => {
      return wsSendMessage(ticketId, content, internal);
    },
    [ticketId, wsSendMessage],
  );

  // Получаем сообщения при монтировании
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Обработка входящего сообщения (обычное и внутреннее)
  const handleIncomingMessage = useCallback(
    (wsMessage: ChatMessageWS) => {
      // Формируем отправителя, если не хватает данных (плоская структура vs вложенная)
      const sender = wsMessage.sender || {
        id: wsMessage.senderId!,
        username: wsMessage.senderUsername || "unknown",
        fio: wsMessage.senderFio || null,
        avatarUrl: null,
        isSpecialist: false,
      };

      // Хелпер для конвертации вложений из WS в тип MessageAttachment
      const convertWsAttachments = (
        wsAttachments?: AttachmentWS[],
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

          // Сохраняем статус прочтения из существующего сообщения —
          // WS-дубликат всегда несёт readByUser/readBySpecialist = false,
          // что может перезатереть обновление от read receipt.
          const readByUser = existingMsg.readByUser || newMsg.readByUser;
          const readBySpecialist =
            existingMsg.readBySpecialist || newMsg.readBySpecialist;

          if (newAttachments && newAttachments.length > 0) {
            updated[existingIndex] = {
              ...existingMsg,
              ...newMsg,
              readByUser,
              readBySpecialist,
              attachments: newAttachments,
            };
          } else {
            updated[existingIndex] = {
              ...existingMsg,
              ...newMsg,
              readByUser,
              readBySpecialist,
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
            (newMsg.attachments || []).map((a) => a.id),
          );
          const uniquePending = pendingAttachments.filter(
            (a) => !existingIds.has(a.id),
          );
          newMsg.attachments = [
            ...(newMsg.attachments || []),
            ...uniquePending,
          ];
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

      queryClient.setQueryData<Ticket | undefined>(
        queryKeys.tickets.detail(ticketId),
        (old) => (old ? { ...old, messageCount: old.messageCount + 1 } : old),
      );
    },
    [queryClient, ticketId],
  );

  // Подписка на сообщения и внутренние комментарии
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToChatMessages(
      ticketId,
      handleIncomingMessage,
    );

    const unsubscribeInternal = user?.specialist
      ? subscribeToInternalComments(ticketId, handleIncomingMessage)
      : undefined;

    return () => {
      unsubscribeMessages();
      unsubscribeInternal?.();
    };
  }, [
    isConnected,
    ticketId,
    subscribeToChatMessages,
    subscribeToInternalComments,
    handleIncomingMessage,
    user?.specialist,
  ]);

  // Подписка на индикатор набора текста
  useEffect(() => {
    if (!isConnected) return;

    return subscribeToTyping(ticketId, (indicator: TypingIndicator) => {
      if (indicator.userId === user?.id) return;

      if (indicator.typing) {
        setTypingUser({ fio: indicator.fio, username: indicator.username });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });
  }, [isConnected, ticketId, subscribeToTyping, user?.id]);

  // Подписка на вложения
  useEffect(() => {
    if (!isConnected) return;

    return subscribeToAttachments(ticketId, (attachment: AttachmentWS) => {
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
            // Сообщение еще не пришло, буферизируем вложение
            const existing = pendingAttachmentsRef.current.get(messageId) || [];
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
              }, 60000);
              pendingTimeoutsRef.current.set(messageId, timeoutId);
            }

            return prev;
          }

          return prev.map((msg) => {
            if (msg.id !== messageId) return msg;

            // Проверяем, есть ли уже такое вложение (по id)
            const existingIds = new Set(
              (msg.attachments || []).map((a) => a.id),
            );
            if (existingIds.has(newAttachment.id)) {
              return msg;
            }

            return {
              ...msg,
              attachments: [...(msg.attachments || []), newAttachment],
            };
          });
        });
      }
      queryClient.setQueryData<Ticket | undefined>(
        queryKeys.tickets.detail(ticketId),
        (old) =>
          old ? { ...old, attachmentCount: old.attachmentCount + 1 } : old,
      );
    });
  }, [
    isConnected,
    ticketId,
    subscribeToAttachments,
    fetchMessages,
    queryClient,
  ]);

  // Подписка на read receipts — обновляем readByUser/readBySpecialist в стейте
  useEffect(() => {
    if (!isConnected) return;

    return subscribeToReadReceipts(ticketId, (receipt: ReadReceiptWS) => {
      // Не обновляем свои собственные receipts
      if (receipt.userId === user?.id) return;

      setMessages((prev) =>
        prev.map((msg) => {
          // Обновляем только чужие сообщения (которые отправил текущий пользователь)
          // receipt от specialist → обновляем readBySpecialist
          // receipt от user → обновляем readByUser
          if (receipt.specialist) {
            return msg.readBySpecialist
              ? msg
              : { ...msg, readBySpecialist: true };
          } else {
            return msg.readByUser ? msg : { ...msg, readByUser: true };
          }
        }),
      );
    });
  }, [isConnected, ticketId, subscribeToReadReceipts, user?.id]);

  // Авто-пометка прочитанными при получении чужого сообщения (только если вкладка видна)
  const prevMessagesLengthRef = useRef(0);
  const hasUnreadRef = useRef(false);

  useEffect(() => {
    if (
      messages.length > prevMessagesLengthRef.current &&
      messages.length > 0
    ) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender.id !== user?.id) {
        if (document.hidden) {
          // Вкладка скрыта — запомним что есть непрочитанные
          hasUnreadRef.current = true;
        } else {
          markReadIfVisible();
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, markReadIfVisible, user?.id, messages]);

  // Когда пользователь возвращается на вкладку — помечаем непрочитанные
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && hasUnreadRef.current) {
        hasUnreadRef.current = false;
        markReadIfVisible();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [markReadIfVisible]);

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
