"use client";

import { useEffect } from "react";
import { useWebSocket } from "@/lib/providers";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import type { Notification } from "@/types/notification";

/**
 * Компонент-подписчик на уведомления пользователя
 * Использует централизованный WebSocketProvider вместо отдельного соединения
 * Должен быть внутри WebSocketProvider
 */
export function NotificationSubscriber() {
  const { user } = useAuthStore();
  const { isConnected, subscribeToUserNotifications } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribeToUserNotifications(
      user.id,
      (notification: Notification) => {
        // Пропускаем STATUS_CHANGE — их обрабатывает useTicketWebSocket на странице тикета
        if (notification.type === "STATUS_CHANGE") {
          console.log(
            "[Notifications] Skipping STATUS_CHANGE toast (handled by useTicketWebSocket)"
          );
          return;
        }

        // Используем централизованный toast хелпер
        if (notification.type === "ASSIGNMENT") {
          toast.success(notification.title, notification.body);
        } else {
          toast.info(notification.title, notification.body);
        }
      }
    );

    console.log(
      "[Notifications] Subscribed to user notifications via WebSocketProvider"
    );

    return () => {
      unsubscribe();
      console.log("[Notifications] Unsubscribed from user notifications");
    };
  }, [isConnected, user?.id, subscribeToUserNotifications]);

  // Этот компонент не рендерит ничего, только подписывается
  return null;
}
