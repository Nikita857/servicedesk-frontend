"use client";

import { useEffect } from "react";
import { useWebSocket } from "@/lib/providers";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import type { Notification } from "@/types/notification";

/**
 * Хук для подписки на уведомления пользователя через централизованный WebSocketProvider
 * Автоматически подписывается при подключении и показывает toast для уведомлений
 */
export function useNotifications() {
  const { user } = useAuthStore();
  const { isConnected, subscribeToUserNotifications } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribeToUserNotifications(user.id, (notification: Notification) => {
      // Пропускаем STATUS_CHANGE — их обрабатывает useTicketWebSocket на странице тикета
      if (notification.type === "STATUS_CHANGE") {
        return;
      }

      if (notification.type === "ASSIGNMENT") {
        toast.success(notification.title, notification.body);
      } else {
        toast.info(notification.title, notification.body);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, user?.id, subscribeToUserNotifications]);

  return { isConnected };
}
