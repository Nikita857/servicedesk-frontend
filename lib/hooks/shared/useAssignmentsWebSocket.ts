"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import { AssignmentWS } from "@/types/websocket";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Хук для подписки на real-time назначения заявок.
 * Показывает тост и обновляет список заявок при получении нового назначения или отклонения.
 */
export function useAssignmentsWebSocket() {
  const { subscribeToAssignments, subscribeToAssignmentRejected, isConnected } =
    useWebSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleNewAssignment = useCallback(
    (assignment: AssignmentWS) => {
      const isCoExecutor = (assignment as { type?: string }).type === "CO_EXECUTOR";
      toast.info(
        isCoExecutor ? "Вы добавлены соисполнителем" : "Новое назначение",
        `Тикет #${assignment.ticketId}: ${assignment.ticketTitle}`
      );

      // Инвалидируем список тикетов чтобы обновить UI
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
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
        queryKey: queryKeys.tickets.detail(assignment.ticketId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
    [queryClient]
  );

  useEffect(() => {
    // Подписываемся только если есть подключение, userId и пользователь - специалист
    if (!isConnected || !user?.id || !user?.specialist) {
      return;
    }
    const unsubscribeNew = subscribeToAssignments(user.id, handleNewAssignment);
    const unsubscribeRejected = subscribeToAssignmentRejected(
      user.id,
      handleAssignmentRejected
    );

    return () => {
      unsubscribeNew();
      unsubscribeRejected();
    };
  }, [isConnected, user?.specialist, subscribeToAssignments, subscribeToAssignmentRejected, handleNewAssignment, handleAssignmentRejected, user?.id]);
}
