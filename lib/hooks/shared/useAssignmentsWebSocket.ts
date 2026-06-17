"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { useAuthStore } from "@/stores";
import { AssignmentWS } from "@/types/websocket";
import { queryKeys } from "@/lib/queryKeys";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";

/**
 * Хук для синхронизации кэша при real-time назначениях заявок.
 * Тосты по этим событиям централизованы в NotificationSubscriber
 * (единый источник для user-level уведомлений), здесь только инвалидация кэшей,
 * чтобы UI перерисовался.
 */
export function useAssignmentsWebSocket() {
  const { subscribeToAssignments, subscribeToAssignmentRejected, isConnected } =
    useWebSocket();
  const { user } = useAuthStore();
  const { hasAny } = useCurrentPermissions();
  const canReceiveAssignments = hasAny([PERM.TICKET_READ_LINE, PERM.TICKET_READ_ALL]);
  const queryClient = useQueryClient();

  const handleNewAssignment = useCallback(() => {
    // Инвалидируем список тикетов чтобы обновить UI
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
  }, [queryClient]);

  const handleAssignmentRejected = useCallback(
    (assignment: AssignmentWS) => {
      // Инвалидируем данные тикета чтобы обновить UI (rejection alert в сайдбаре)
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(assignment.ticketId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isConnected || !user?.id || !canReceiveAssignments) {
      return;
    }
    const unsubscribeNew = subscribeToAssignments(user.id, handleNewAssignment);
    const unsubscribeRejected = subscribeToAssignmentRejected(
      user.id,
      handleAssignmentRejected,
    );

    return () => {
      unsubscribeNew();
      unsubscribeRejected();
    };
  }, [
    isConnected,
    canReceiveAssignments,
    subscribeToAssignments,
    subscribeToAssignmentRejected,
    handleNewAssignment,
    handleAssignmentRejected,
    user?.id,
  ]);
}
