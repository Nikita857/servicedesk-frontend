"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "@/lib/config";
import { useAuthStore } from "@/stores";
import { refreshAccessToken } from "@/lib/api/client";
import { createWebSocketContract } from "@/lib/websocket/contract";
import type { ServerMessages } from "@/lib/websocket/generated/catalog";

type TicketListEventWS = ServerMessages["tickets"];
type TicketWS = ServerMessages["ticket"];
type ChatMessageWS = ServerMessages["ticketMessages"];
type TypingIndicator = ServerMessages["ticketTyping"];
type AttachmentWS = ServerMessages["ticketAttachments"];
type ReadReceiptWS = ServerMessages["ticketReadReceipts"];
type AssignmentWS = ServerMessages["assignments"];
type UserStatusWS = ServerMessages["userStatus"];

interface WebSocketContextValue {
  isConnected: boolean;
  /**
   * Агрегированный поток событий тикетов (/topic/tickets).
   * Несёт компактный payload — подходит для списочных вьюх,
   * фронт фильтрует события локально без N подписок на каждый тикет.
   */
  subscribeToTickets: (
    callback: (event: TicketListEventWS) => void,
  ) => () => void;
  subscribeToTicketUpdates: (
    ticketId: number,
    callback: (ticket: TicketWS) => void,
  ) => () => void;
  subscribeToTicketDeleted: (
    ticketId: number,
    callback: (data: ServerMessages["ticketDeleted"]) => void,
  ) => () => void;
  // Chat (for tickets)
  sendMessage: (
    ticketId: number,
    content: string,
    internal?: boolean,
  ) => boolean;
  sendTyping: (ticketId: number, typing: boolean) => void;
  subscribeToChatMessages: (
    ticketId: number,
    callback: (message: ChatMessageWS) => void,
  ) => () => void;
  subscribeToInternalComments: (
    ticketId: number,
    callback: (message: ChatMessageWS) => void,
  ) => () => void;
  subscribeToTyping: (
    ticketId: number,
    callback: (indicator: TypingIndicator) => void,
  ) => () => void;
  subscribeToAttachments: (
    ticketId: number,
    callback: (attachment: AttachmentWS) => void,
  ) => () => void;
  subscribeToReadReceipts: (
    ticketId: number,
    callback: (receipt: ReadReceiptWS) => void,
  ) => () => void;
  sendReadReceipt: (ticketId: number) => void;
  // User subscriptions
  subscribeToUserNotifications: (
    userId: number,
    callback: (notification: ServerMessages["notifications"]) => void,
  ) => () => void;
  // Assignment subscriptions (user-specific topics)
  subscribeToAssignments: (
    userId: number,
    callback: (assignment: AssignmentWS) => void,
  ) => () => void;
  subscribeToAssignmentRejected: (
    userId: number,
    callback: (assignment: AssignmentWS) => void,
  ) => () => void;
  // Status subscriptions
  subscribeToUserStatus: (
    userId: number,
    callback: (payload: UserStatusWS) => void,
  ) => () => void;
  subscribeToLineStatus: (
    lineId: number,
    callback: (payload: UserStatusWS) => void,
  ) => () => void;
}

// ==================== Context ====================

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ==================== Provider ====================

type StompCallback = (message: IMessage) => void;

interface SubscriptionEntry {
  sub: StompSubscription;
  callbacks: Set<StompCallback>;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  // destination -> { общая STOMP-подписка + набор колбэков для fan-out }
  // Fan-out даёт нескольким независимым компонентам слушать один и тот же
  // топик (например, /topic/ticket/new) без взаимного вытеснения.
  const subscriptionsRef = useRef<Map<string, SubscriptionEntry>>(new Map());

  // Connect to WebSocket
  useEffect(() => {
    if (!isAuthenticated) {
      if (clientRef.current?.connected) {
        clientRef.current.deactivate();
      }
      return;
    }

    const client = new Client({
      // Use brokerURL for native WebSockets, or webSocketFactory for SockJS
      ...(WS_URL.startsWith("ws")
        ? { brokerURL: WS_URL }
        : {
            webSocketFactory: () =>
              new SockJS(WS_URL, null, {
                transports: ["websocket", "xhr-streaming", "xhr-polling"],
              }) as WebSocket,
          }),
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          // Log only important STOMP messages or all in verbose mode
          if (!str.includes("PING") && !str.includes("PONG")) {
          }
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setIsConnected(true);
    };

    client.onDisconnect = () => {
      setIsConnected(false);
    };

    client.onStompError = async (frame) => {
      const errorMessage = frame.headers["message"];
      const errorBody = frame.body;

      console.error("[WS] STOMP ошибка:", errorMessage);

      // Check for token expired in body or headers
      if (
        errorBody?.includes("TOKEN_EXPIRED") ||
        errorMessage?.includes("TOKEN_EXPIRED")
      ) {
        await refreshAccessToken();
        // effect will re-run automatically because accessToken is a dependency
      }
    };

    client.onWebSocketError = async (event) => {
      // Попытка извлечь больше информации из события ошибки
      let errorDetails = "";
      if (event instanceof ErrorEvent) {
        errorDetails = ` (${event.message})`;
      } else if (event instanceof CloseEvent) {
        errorDetails = ` (Close code: ${event.code}, Reason: ${event.reason})`;

        // Often 401 error results in close code 1006 or specific reason
        if (event.code === 1006 || event.reason?.includes("TOKEN_EXPIRED")) {
          await refreshAccessToken();
        }
      }
      console.error(`[WS] WebSocket ошибка${errorDetails}`, event);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      // Clean up all subscriptions
      subscriptionsRef.current.forEach((entry) => entry.sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
    };
  }, [user, isAuthenticated]);

  // Helper to subscribe with tracking.
  // Поддерживает множественных независимых подписчиков на один и тот же
  // destination: STOMP-подписка создаётся один раз, входящие сообщения
  // фаноутятся всем зарегистрированным колбэкам. При отписке последнего
  // подписчика STOMP-подписка закрывается.
  const subscribe = useCallback(
    (destination: string, callback: StompCallback): (() => void) => {
      const client = clientRef.current;

      // Check both ref and actual connection state
      if (!client || !client.connected) {
        console.warn(
          "[WS] Нет подключения. Невозможно подписаться на: ",
          destination,
        );
        return () => {};
      }

      let entry = subscriptionsRef.current.get(destination);
      if (!entry) {
        const callbacks = new Set<StompCallback>();
        const sub = client.subscribe(destination, (message) => {
          // Важно: ошибка одного подписчика не должна ронять остальных
          callbacks.forEach((cb) => {
            try {
              cb(message);
            } catch (e) {
              console.error("[WS] Ошибка в подписчике на", destination, e);
            }
          });
        });
        entry = { sub, callbacks };
        subscriptionsRef.current.set(destination, entry);
      }
      entry.callbacks.add(callback);

      return () => {
        const current = subscriptionsRef.current.get(destination);
        if (!current) return;
        current.callbacks.delete(callback);
        if (current.callbacks.size === 0) {
          current.sub.unsubscribe();
          subscriptionsRef.current.delete(destination);
        }
      };
    },
    [],
  );

  const publishTransport = useCallback((frame: { destination: string; body: string }) => {
    clientRef.current?.publish(frame);
  }, []);
  const getContract = useCallback(() => createWebSocketContract({
    subscribe,
    publish: publishTransport,
  }), [subscribe, publishTransport]);

  // ==================== Ticket Subscriptions ====================

  const subscribeToTickets = useCallback(
    (callback: (event: TicketListEventWS) => void) =>
      getContract().subscribeTyped<"tickets">("/topic/tickets", callback),
    [getContract],
  );

  const subscribeToTicketUpdates = useCallback(
    (ticketId: number, callback: (ticket: TicketWS) => void) => {
      return getContract().subscribeTyped<"ticket">(`/topic/ticket/${ticketId}`, callback);
    },
    [getContract],
  );

  const subscribeToTicketDeleted = useCallback(
    (ticketId: number, callback: (data: ServerMessages["ticketDeleted"]) => void) => {
      return getContract().subscribeTyped<"ticketDeleted">(`/topic/ticket/${ticketId}/deleted`, callback);
    },
    [getContract],
  );

  // ==================== Chat Subscriptions ====================

  const subscribeToChatMessages = useCallback(
    (ticketId: number, callback: (message: ChatMessageWS) => void) => {
      return getContract().subscribeTyped<"ticketMessages">(`/topic/ticket/${ticketId}/messages`, callback);
    },
    [getContract],
  );

  const subscribeToInternalComments = useCallback(
    (ticketId: number, callback: (message: ChatMessageWS) => void) => {
      return getContract().subscribeTyped<"ticketInternal">(`/topic/ticket/${ticketId}/internal`, callback);
    },
    [getContract],
  );

  const subscribeToTyping = useCallback(
    (ticketId: number, callback: (indicator: TypingIndicator) => void) => {
      return getContract().subscribeTyped<"ticketTyping">(`/topic/ticket/${ticketId}/typing`, callback);
    },
    [getContract],
  );

  const subscribeToAttachments = useCallback(
    (ticketId: number, callback: (attachment: AttachmentWS) => void) => {
      return getContract().subscribeTyped<"ticketAttachments">(`/topic/ticket/${ticketId}/attachments`, callback);
    },
    [getContract],
  );

  const subscribeToReadReceipts = useCallback(
    (ticketId: number, callback: (receipt: ReadReceiptWS) => void) => {
      return getContract().subscribeTyped<"ticketReadReceipts">(`/topic/ticket/${ticketId}/read`, callback);
    },
    [getContract],
  );

  const sendReadReceipt = useCallback((ticketId: number) => {
    const client = clientRef.current;
    if (!client?.connected) return;

    getContract().publishTyped<"ticketRead">(`/app/ticket/${ticketId}/read`, null);
  }, [getContract]);

  // ==================== User Subscriptions ====================

  const subscribeToUserNotifications = useCallback(
    (userId: number, callback: (notification: ServerMessages["notifications"]) => void) => {
      return getContract().subscribeTyped<"notifications">(`/topic/user/${userId}/notifications`, callback);
    },
    [getContract],
  );

  const subscribeToAssignments = useCallback(
    (userId: number, callback: (assignment: AssignmentWS) => void) => {
      return getContract().subscribeTyped<"assignments">(`/topic/user/${userId}/assignments`, callback);
    },
    [getContract],
  );

  const subscribeToAssignmentRejected = useCallback(
    (userId: number, callback: (assignment: AssignmentWS) => void) => {
      return getContract().subscribeTyped<"rejectedAssignments">(`/topic/user/${userId}/assignments/rejected`, callback);
    },
    [getContract],
  );

  // ==================== Status Subscriptions ====================

  const subscribeToUserStatus = useCallback(
    (userId: number, callback: (payload: UserStatusWS) => void) => {
      return getContract().subscribeTyped<"userStatus">(`/topic/user/${userId}/status`, callback);
    },
    [getContract],
  );

  const subscribeToLineStatus = useCallback(
    (lineId: number, callback: (payload: UserStatusWS) => void) => {
      return getContract().subscribeTyped<"lineStatus">(`/topic/line/${lineId}/status`, callback);
    },
    [getContract],
  );

  // ==================== Send Methods ====================

  const sendMessage = useCallback(
    (ticketId: number, content: string, internal = false): boolean => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WS] Ошибки broadcast отправки. Нет подключения");
        return false;
      }

      getContract().publishTyped<"ticketSend">(`/app/ticket/${ticketId}/send`, { content, internal });

      return true;
    },
    [getContract],
  );

  const sendTyping = useCallback((ticketId: number, typing: boolean) => {
    const client = clientRef.current;
    if (!client?.connected) return;

    getContract().publishTyped<"ticketTypingCommand">(`/app/ticket/${ticketId}/typing`, { typing });
  }, [getContract]);

  // ==================== Context Value ====================

  const value: WebSocketContextValue = {
    isConnected,
    subscribeToTickets,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    subscribeToUserNotifications,
    subscribeToAssignments,
    subscribeToAssignmentRejected,
    sendMessage,
    sendTyping,
    subscribeToChatMessages,
    subscribeToInternalComments,
    subscribeToTyping,
    subscribeToAttachments,
    subscribeToReadReceipts,
    sendReadReceipt,
    subscribeToUserStatus,
    subscribeToLineStatus,
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
