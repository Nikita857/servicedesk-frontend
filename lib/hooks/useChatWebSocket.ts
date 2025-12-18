"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import {
  ticketWebSocket,
  type ChatMessageWS,
  type TypingIndicator,
  type AttachmentWS,
} from "@/lib/websocket/ticketWebSocket";
import type { Message, MessageAttachment } from "@/types/message";
import type { SenderType } from "@/types/message";

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
  fetchMessages: () => Promise<void>;
}

export function useChatWebSocket(ticketId: number) {
  const { accessToken, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<{
    fio: string;
    username: string;
  } | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Buffer for attachments that arrive before their messages
  const pendingAttachmentsRef = useRef<Map<number, MessageAttachment[]>>(new Map());
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
  const sendTypingIndicator = useCallback((typing: boolean) => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1000 || !typing) {
      ticketWebSocket.sendTyping(typing);
      lastTypingSentRef.current = now;
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    fetchMessages();

    if (accessToken) {
      ticketWebSocket.connect(ticketId, accessToken, {
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
        onMessage: (wsMessage: ChatMessageWS) => {
          const newMsg: Message = {
            id: wsMessage.id,
            ticketId: wsMessage.ticketId,
            content: wsMessage.content,
            sender: {
              id: wsMessage.senderId,
              username: wsMessage.senderUsername,
              fio: wsMessage.senderFio,
            },
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
            }
            
            return [...prev, newMsg];
          });
        },
        onTyping: (indicator: TypingIndicator) => {
          if (indicator.userId === user?.id) return;

          if (indicator.typing) {
            setTypingUser({ fio: indicator.fio ?? indicator.username, username: indicator.username });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
          } else {
            setTypingUser(null);
          }
        },
        onAttachment: (attachment: AttachmentWS) => {
          // Convert AttachmentWS to MessageAttachment
          const newAttachment: MessageAttachment = {
            id: attachment.id,
            filename: attachment.filename,
            url: attachment.url,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
            type: attachment.type,
          };

          // Update message with this attachment
          const messageId = attachment.messageId;
          if (messageId !== null && messageId !== undefined) {
            setMessages((prev) => {
              const messageExists = prev.some(m => m.id === messageId);
              
              if (!messageExists) {
                // Message hasn't arrived yet, buffer the attachment
                const existing = pendingAttachmentsRef.current.get(messageId) || [];
                pendingAttachmentsRef.current.set(messageId, [...existing, newAttachment]);
                return prev; // No update needed yet
              }
              
              const updated = prev.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      attachments: [...(msg.attachments || []), newAttachment],
                    }
                  : msg
              );
              return updated;
            });
          } else {
            // No messageId, skip update
          }
        },
        onError: (error) => console.error("[WS] Error:", error),
      });
    }

    return () => {
      ticketWebSocket.disconnect();
    };
  }, [ticketId, accessToken, fetchMessages, user?.id]);

  return {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
    fetchMessages,
  };
}
