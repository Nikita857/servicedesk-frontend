"use client";

import { useEffect } from "react";
import { useWebSocket } from "@/lib/providers";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";
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
        console.log("[Notifications] Skipping STATUS_CHANGE toast (handled by useTicketWebSocket)");
        return;
      }

      const toastType =
        notification.type === "MESSAGE"
          ? "info"
          : notification.type === "ASSIGNMENT"
          ? "success"
          : "info";

      toaster.create({
        title: notification.title,
        description: notification.body,
        type: toastType,
        duration: 5000,
        meta: {
          closable: true,
        },
      });
    });

    console.log("[Notifications] Subscribed to user notifications");

    return () => {
      unsubscribe();
      console.log("[Notifications] Unsubscribed from user notifications");
    };
  }, [isConnected, user?.id, subscribeToUserNotifications]);

  return { isConnected };
}
