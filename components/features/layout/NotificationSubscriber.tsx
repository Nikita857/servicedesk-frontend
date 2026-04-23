"use client";

import { useEffect } from "react";
import { useWebSocket } from "@/lib/providers";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/notification";

type ToastLevel = "info" | "success" | "warning" | "error";

/**
 * Как показывать toast для каждого типа уведомления.
 * null — тост не показываем (обрабатывается в другом месте).
 */
const TOAST_LEVEL_BY_TYPE: Record<NotificationType, ToastLevel | null> = {
  // Обрабатывается useTicketWebSocket на странице тикета (с учётом suppress-механизма)
  STATUS_CHANGE: null,
  // Индикатор непрочитанного в чате/списке — свой UI
  MESSAGE: null,
  // Есть отдельный интерактивный RatingToast с формой оценки
  RATING: null,

  ASSIGNMENT: "info",
  ASSIGNMENT_ACCEPTED: "success",
  ASSIGNMENT_REJECTED: "warning",
  ASSIGNMENT_CANCELLED: "warning",
  CO_EXECUTOR_ADDED: "info",
  CO_EXECUTOR_REMOVED: "warning",
  ESTIMATED_DATE: "info",
  TICKET_CREATED: "success",
  TICKET_TAKEN: "info",
  SPECIALIST_ADDED_TO_LINE: "info",
  SPECIALIST_REMOVED_FROM_LINE: "warning",
};

/**
 * Единая точка показа toast'ов для user-level уведомлений из WebSocket.
 * Тексты берутся из полей title/body — их формирует бэкенд (см. Notification.java).
 * Должен быть внутри WebSocketProvider.
 */
export function NotificationSubscriber() {
  const { user } = useAuthStore();
  const { isConnected, subscribeToUserNotifications } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribeToUserNotifications(
      user.id,
      (notification: Notification) => {
        const level = TOAST_LEVEL_BY_TYPE[notification.type];
        if (!level) return;
        toast[level](notification.title, notification.body);
      },
    );
    return () => {
      unsubscribe();
    };
  }, [isConnected, user?.id, subscribeToUserNotifications]);

  return null;
}
