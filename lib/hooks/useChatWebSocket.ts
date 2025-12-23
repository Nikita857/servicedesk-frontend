"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import { useWebSocket } from "@/lib/providers";
import type { Message, MessageAttachment } from "@/types/message";
import type { SenderType } from "@/types/message";
import type { ChatMessageWS, TypingIndicator, AttachmentWS } from "@/types/websocket";

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
 * Hook для управления чатом тикета через WebSocket
 * Использует централизованный WebSocketProvider вместо singleton
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
  // Buffer for attachments that arrive before their messages
  const pendingAttachmentsRef = useRef<Map<number, MessageAttachment[]>>(new Map());
  // Store timeouts for cleaning up orphaned attachments
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastTypingSentRef = useRef<number>(0);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      await messageApi.markAsRead(ticketId);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  // Send typing indicator (debounced)
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

  // Send message via WebSocket
  const sendMessage = useCallback(
    (content: string, internal = false): boolean => {
      return wsSendMessage(ticketId, content, internal);
    },
    [ticketId, wsSendMessage]
  );

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle incoming message (both regular and internal)
  const handleIncomingMessage = useCallback((wsMessage: ChatMessageWS) => {
    // Construct sender if missing (flat structure vs nested)
    const sender = wsMessage.sender || {
      id: wsMessage.senderId!,
      username: wsMessage.senderUsername || "unknown",
      fio: wsMessage.senderFio || null,
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
    };

    setMessages((prev) => {
      if (prev.find((m) => m.id === newMsg.id)) return prev;

      // Check if there are pending attachments for this message
      const pendingAttachments = pendingAttachmentsRef.current.get(newMsg.id);
      if (pendingAttachments) {
        newMsg.attachments = pendingAttachments;
        pendingAttachmentsRef.current.delete(newMsg.id);
        
        // Clear cleanup timeout
        const timeoutId = pendingTimeoutsRef.current.get(newMsg.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingTimeoutsRef.current.delete(newMsg.id);
        }
      }

      return [...prev, newMsg];
    });
  }, []);

  // Subscribe to chat messages and internal comments
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToChatMessages(ticketId, handleIncomingMessage);
    const unsubscribeInternal = subscribeToInternalComments(ticketId, handleIncomingMessage);

    return () => {
      unsubscribeMessages();
      unsubscribeInternal();
    };
  }, [isConnected, ticketId, subscribeToChatMessages, subscribeToInternalComments, handleIncomingMessage]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToTyping(ticketId, (indicator: TypingIndicator) => {
      if (indicator.userId === user?.id) return;

      if (indicator.typing) {
        setTypingUser({ fio: indicator.fio, username: indicator.username });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    return unsubscribe;
  }, [isConnected, ticketId, subscribeToTyping, user?.id]);

  // Subscribe to attachments
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToAttachments(ticketId, (attachment: AttachmentWS) => {
      // Convert AttachmentWS to MessageAttachment
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
            // Message hasn't arrived yet, buffer the attachment
            const existing = pendingAttachmentsRef.current.get(messageId) || [];
            pendingAttachmentsRef.current.set(messageId, [...existing, newAttachment]);

            // Set cleanup timeout (60 seconds) to avoid memory leaks
            // If message doesn't arrive in 60s, discard these attachments
            if (!pendingTimeoutsRef.current.has(messageId)) {
              const timeoutId = setTimeout(() => {
                pendingAttachmentsRef.current.delete(messageId);
                pendingTimeoutsRef.current.delete(messageId);
                console.warn(`Cleaned up orphaned attachments for message ${messageId}`);
              }, 60000);
              pendingTimeoutsRef.current.set(messageId, timeoutId);
            }
            
            return prev;
          }

          return prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  attachments: [...(msg.attachments || []), newAttachment],
                }
              : msg
          );
        });
      }
    });

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
