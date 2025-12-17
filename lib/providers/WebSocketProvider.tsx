"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "@/lib/config";
import { useAuthStore } from "@/stores";
import { Ticket } from "@/types/ticket";

// ==================== Types ====================

export interface TicketUpdatePayload {
  ticket: Ticket;
  eventType:
    | "created"
    | "updated"
    | "deleted"
    | "taken"
    | "assigned"
    | "status_changed";
}

interface WebSocketContextValue {
  isConnected: boolean;
  // Ticket subscriptions
  subscribeToNewTickets: (callback: (ticket: Ticket) => void) => () => void;
  subscribeToTicketUpdates: (
    ticketId: number,
    callback: (ticket: Ticket) => void
  ) => () => void;
  subscribeToTicketDeleted: (
    ticketId: number,
    callback: (data: { id: number }) => void
  ) => () => void;
  // Chat (for tickets)
  sendMessage: (
    ticketId: number,
    content: string,
    internal?: boolean
  ) => boolean;
  sendTyping: (ticketId: number, typing: boolean) => void;
  subscribeToChatMessages: (
    ticketId: number,
    callback: (message: ChatMessageWS) => void
  ) => () => void;
  subscribeToTyping: (
    ticketId: number,
    callback: (indicator: TypingIndicator) => void
  ) => () => void;
}

export interface ChatMessageWS {
  id: number;
  ticketId: number;
  content: string;
  senderId: number;
  senderUsername: string;
  senderFio: string | null;
  senderType: string;
  internal: boolean;
  createdAt: string;
}

export interface TypingIndicator {
  ticketId: number;
  userId: number;
  username: string;
  fio: string | null;
  typing: boolean;
}

// ==================== Context ====================

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ==================== Provider ====================

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());

  // Connect to WebSocket
  useEffect(() => {
    if (!accessToken || !user) {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
      }
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[WS]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("[WS] Connected");
      setIsConnected(true);
    };

    client.onDisconnect = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("[WS] STOMP error:", frame.headers["message"]);
    };

    client.onWebSocketError = (event) => {
      console.error("[WS] WebSocket error:", event);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      // Clean up all subscriptions
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
    };
  }, [accessToken, user]);

  // Helper to subscribe with tracking
  const subscribe = useCallback(
    (
      destination: string,
      callback: (message: IMessage) => void
    ): (() => void) => {
      const client = clientRef.current;

      // Check both ref and actual connection state
      if (!client || !client.connected) {
        console.warn("[WS] Not connected, cannot subscribe to", destination);
        return () => {};
      }

      // Avoid duplicate subscriptions
      const existingKey = `${destination}`;
      if (subscriptionsRef.current.has(existingKey)) {
        subscriptionsRef.current.get(existingKey)?.unsubscribe();
      }

      console.log("[WS] Subscribing to", destination);
      const subscription = client.subscribe(destination, callback);
      subscriptionsRef.current.set(existingKey, subscription);

      return () => {
        console.log("[WS] Unsubscribing from", destination);
        subscription.unsubscribe();
        subscriptionsRef.current.delete(existingKey);
      };
    },
    []
  );

  // ==================== Ticket Subscriptions ====================

  const subscribeToNewTickets = useCallback(
    (callback: (ticket: Ticket) => void) => {
      return subscribe("/topic/ticket/new", (message) => {
        try {
          const ticket: Ticket = JSON.parse(message.body);
          callback(ticket);
        } catch (e) {
          console.error("[WS] Failed to parse new ticket:", e);
        }
      });
    },
    [subscribe]
  );

  const subscribeToTicketUpdates = useCallback(
    (ticketId: number, callback: (ticket: Ticket) => void) => {
      return subscribe(`/topic/ticket/${ticketId}`, (message) => {
        try {
          const ticket: Ticket = JSON.parse(message.body);
          callback(ticket);
        } catch (e) {
          console.error("[WS] Failed to parse ticket update:", e);
        }
      });
    },
    [subscribe]
  );

  const subscribeToTicketDeleted = useCallback(
    (ticketId: number, callback: (data: { id: number }) => void) => {
      return subscribe(`/topic/ticket/${ticketId}/deleted`, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (e) {
          console.error("[WS] Failed to parse ticket deleted:", e);
        }
      });
    },
    [subscribe]
  );

  // ==================== Chat Subscriptions ====================

  const subscribeToChatMessages = useCallback(
    (ticketId: number, callback: (message: ChatMessageWS) => void) => {
      return subscribe(`/topic/ticket/${ticketId}/messages`, (message) => {
        try {
          const chatMessage: ChatMessageWS = JSON.parse(message.body);
          callback(chatMessage);
        } catch (e) {
          console.error("[WS] Failed to parse chat message:", e);
        }
      });
    },
    [subscribe]
  );

  const subscribeToTyping = useCallback(
    (ticketId: number, callback: (indicator: TypingIndicator) => void) => {
      return subscribe(`/topic/ticket/${ticketId}/typing`, (message) => {
        try {
          const indicator: TypingIndicator = JSON.parse(message.body);
          callback(indicator);
        } catch (e) {
          console.error("[WS] Failed to parse typing indicator:", e);
        }
      });
    },
    [subscribe]
  );

  // ==================== Send Methods ====================

  const sendMessage = useCallback(
    (ticketId: number, content: string, internal = false): boolean => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WS] Not connected, cannot send message");
        return false;
      }

      client.publish({
        destination: `/app/ticket/${ticketId}/send`,
        body: JSON.stringify({ content, internal }),
      });

      return true;
    },
    []
  );

  const sendTyping = useCallback((ticketId: number, typing: boolean) => {
    const client = clientRef.current;
    if (!client?.connected) return;

    client.publish({
      destination: `/app/ticket/${ticketId}/typing`,
      body: JSON.stringify({ typing }),
    });
  }, []);

  // ==================== Context Value ====================

  const value: WebSocketContextValue = {
    isConnected,
    subscribeToNewTickets,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    sendMessage,
    sendTyping,
    subscribeToChatMessages,
    subscribeToTyping,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ==================== Hook ====================

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}
