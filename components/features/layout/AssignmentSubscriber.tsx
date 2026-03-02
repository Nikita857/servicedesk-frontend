"use client";

import { useAssignmentsWebSocket } from "@/lib/hooks/shared/useAssignmentsWebSocket";

/**
 * Компонент-подписчик на real-time назначения тикетов.
 * Использовать внутри WebSocketProvider.
 */
export function AssignmentSubscriber() {
  useAssignmentsWebSocket();
  return null;
}
