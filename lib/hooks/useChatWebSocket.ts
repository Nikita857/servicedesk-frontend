"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import { ticketApi } from "@/lib/api";
import {
  ticketWebSocket,
  type ChatMessageWS,
  type TypingIndicator,
} from "@/lib/websocket/ticketWebSocket";
import type { Message } from "@/types/message";
import type { SenderType } from "@/types/message";
import type { TicketStatus } from "@/types";

interface TypingUser {
  fio: string | null;
  username: string;
}

interface UseChatWebSocketReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  isConnected: boolean;
  ticketStatus: TicketStatus;
  typingUser: TypingUser | null;
  sendTypingIndicator: (typing: boolean) => void;
  fetchMessages: () => Promise<void>;
}

export function useChatWebSocket(ticketId: number): UseChatWebSocketReturn {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("OPEN");
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Fetch ticket status
  const fetchTicket = useCallback(async () => {
    try {
      const response = await ticketApi.get(ticketId);
      setTicketStatus(response.status);
    } catch (error) {
      console.error("Failed to load ticket", error);
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
    fetchTicket();

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
            return [...prev, newMsg];
          });
        },
        onTyping: (indicator: TypingIndicator) => {
          if (indicator.userId === user?.id) return;

          if (indicator.typing) {
            setTypingUser({ fio: indicator.fio, username: indicator.username });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
          } else {
            setTypingUser(null);
          }
        },
        onError: (error) => console.error("[WS] Error:", error),
      });
    }

    return () => {
      ticketWebSocket.disconnect();
    };
  }, [ticketId, accessToken, fetchMessages, fetchTicket, user?.id]);

  return {
    messages,
    setMessages,
    isLoading,
    isConnected,
    ticketStatus,
    typingUser,
    sendTypingIndicator,
    fetchMessages,
  };
}
