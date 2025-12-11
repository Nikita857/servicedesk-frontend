import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from '../config';

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
  typing: boolean;
}

export interface WebSocketCallbacks {
  onMessage?: (message: ChatMessageWS) => void;
  onTyping?: (indicator: TypingIndicator) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

class TicketWebSocket {
  private client: Client | null = null;
  private ticketId: number | null = null;
  private callbacks: WebSocketCallbacks = {};

  connect(ticketId: number, accessToken: string, callbacks: WebSocketCallbacks) {
    this.ticketId = ticketId;
    this.callbacks = callbacks;

    // Disconnect existing connection
    if (this.client?.connected) {
      this.client.deactivate();
    }

    this.client = new Client({
      // Use SockJS for Spring Boot compatibility
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP]', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('[WS] Connected to ticket', ticketId);
      callbacks.onConnect?.();

      // Subscribe to messages
      this.client?.subscribe(`/topic/ticket/${ticketId}`, (message: IMessage) => {
        try {
          const chatMessage: ChatMessageWS = JSON.parse(message.body);
          callbacks.onMessage?.(chatMessage);
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      });

      // Subscribe to typing indicators
      this.client?.subscribe(`/topic/ticket/${ticketId}/typing`, (message: IMessage) => {
        try {
          const indicator: TypingIndicator = JSON.parse(message.body);
          callbacks.onTyping?.(indicator);
        } catch (e) {
          console.error('[WS] Failed to parse typing indicator', e);
        }
      });
    };

    this.client.onDisconnect = () => {
      console.log('[WS] Disconnected');
      callbacks.onDisconnect?.();
    };

    this.client.onStompError = (frame) => {
      console.error('[WS] STOMP error', frame.headers['message']);
      callbacks.onError?.(frame.headers['message'] || 'WebSocket error');
    };

    this.client.onWebSocketError = (event) => {
      console.error('[WS] WebSocket error', event);
      callbacks.onError?.('WebSocket connection error');
    };

    this.client.activate();
  }

  sendMessage(content: string, internal = false) {
    if (!this.client?.connected || !this.ticketId) {
      console.warn('[WS] Not connected, cannot send message');
      return false;
    }

    this.client.publish({
      destination: `/app/ticket/${this.ticketId}/send`,
      body: JSON.stringify({ content, internal }),
    });

    return true;
  }

  sendTyping(typing: boolean) {
    if (!this.client?.connected || !this.ticketId) {
      return;
    }

    this.client.publish({
      destination: `/app/ticket/${this.ticketId}/typing`,
      body: JSON.stringify({ typing }),
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.ticketId = null;
    this.callbacks = {};
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

// Singleton instance
export const ticketWebSocket = new TicketWebSocket();
