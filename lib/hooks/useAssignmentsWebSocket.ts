"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import { AssignmentWS } from "@/types/websocket";

/**
 * Хук для подписки на real-time назначения тикетов.
 * Показывает тост и обновляет список тикетов при получении нового назначения или отклонения.
 */
export function useAssignmentsWebSocket() {
  const { subscribeToAssignments, subscribeToAssignmentRejected, isConnected } =
    useWebSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleNewAssignment = useCallback(
    (assignment: AssignmentWS) => {
      // Показываем тост с информацией о новом назначении
      toast.info(
        "Новое назначение",
        `Вам назначен тикет #${assignment.ticketId}: ${assignment.ticketTitle}`
      );

      // Инвалидируем список тикетов чтобы обновить UI
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketsCount"] });
    },
    [queryClient]
  );

  const handleAssignmentRejected = useCallback(
    (assignment: AssignmentWS) => {
      // Показываем тост об отклонении
      const rejectedBy =
        assignment.toUser?.fio ||
        assignment.toUser?.username ||
        assignment.toLine?.name ||
        "Специалист";
      toast.error(
        "Назначение отклонено",
        `${rejectedBy} отклонил назначение на тикет #${assignment.ticketId}: ${assignment.ticketTitle}`
      );

      // Инвалидируем данные тикета чтобы обновить UI (rejection alert в сайдбаре)
      queryClient.invalidateQueries({
        queryKey: ["ticket", assignment.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketsCount"] });
    },
    [queryClient]
  );

  useEffect(() => {
    // Подписываемся только если есть подключение и пользователь - специалист
    if (!isConnected || !user?.specialist) {
      return;
    }

    console.log("[Assignments WS] Подписка на назначения");
    const unsubscribeNew = subscribeToAssignments(handleNewAssignment);
    const unsubscribeRejected = subscribeToAssignmentRejected(
      handleAssignmentRejected
    );

    return () => {
      console.log("[Assignments WS] Отписка от назначений");
      unsubscribeNew();
      unsubscribeRejected();
    };
  }, [
    isConnected,
    user?.specialist,
    subscribeToAssignments,
    subscribeToAssignmentRejected,
    handleNewAssignment,
    handleAssignmentRejected,
  ]);
}
