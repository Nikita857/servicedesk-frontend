"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { useAuthStore } from "@/stores";
import { toast } from "@/lib/utils";
import { Ticket } from "@/types/ticket";

/**
 * Хук для подписки на real-time назначения тикетов.
 * Показывает тост и обновляет список тикетов при получении нового назначения.
 */
export function useAssignmentsWebSocket() {
  const { subscribeToAssignments, isConnected } = useWebSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleNewAssignment = useCallback(
    (ticket: Ticket) => {
      // Показываем тост с информацией о новом назначении
      toast.info(
        "Новое назначение",
        `Вам назначен тикет #${ticket.id}: ${ticket.title}`
      );

      // Инвалидируем список тикетов чтобы обновить UI
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
    const unsubscribe = subscribeToAssignments(handleNewAssignment);

    return () => {
      console.log("[Assignments WS] Отписка от назначений");
      unsubscribe();
    };
  }, [
    isConnected,
    user?.specialist,
    subscribeToAssignments,
    handleNewAssignment,
  ]);
}
