import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Notification } from '@/types/notification';
import { WS_URL } from '@/lib/config';

let stompClient: Client | null = null;
let notificationSubscription: { unsubscribe: () => void } | null = null;

type NotificationHandler = (notification: Notification) => void;

/**
 * Connect to notification WebSocket
 */
export function connectNotifications(
  userId: number,
  accessToken: string,
  onNotification: NotificationHandler,
  onConnect?: () => void,
  onDisconnect?: () => void
): void {
  if (stompClient?.connected) {
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      
      // Subscribe to user's notification topic
      notificationSubscription = stompClient!.subscribe(
        `/topic/user/${userId}/notifications`,
        (message: IMessage) => {
          try {
            const notification: Notification = JSON.parse(message.body);
            onNotification(notification);
          } catch (error) {
            console.error('[NotificationWS] Parse error:', error);
          }
        }
      );

      onConnect?.();
    },

    onDisconnect: () => {
      onDisconnect?.();
    },

    onStompError: (frame) => {
      console.error('[NotificationWS] STOMP error:', frame.headers['message']);
    },
  });

  stompClient.activate();
}

/**
 * Disconnect from notification WebSocket
 */
export function disconnectNotifications(): void {
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
    notificationSubscription = null;
  }

  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

/**
 * Check if connected
 */
export function isNotificationConnected(): boolean {
  return stompClient?.connected ?? false;
}
