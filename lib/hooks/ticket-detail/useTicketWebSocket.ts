import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers";
import { toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ticket } from "@/types/ticket";
import { User } from "@/types";

interface UseTicketWebSocketOptions {
  ticketId: number;
  currentTicket: Ticket | null;
  onTicketUpdate?: (ticket: Ticket) => void;
  onTicketDeleted?: () => void;
  user: User | null;
  enabled?: boolean;
  showToasts?: boolean;
}

// Глобальный Map для отслеживания подавления тостов
// Ключ = ticketId, значение = timestamp до которого подавляем тосты
const suppressedToastsMap = new Map<number, number>();

/**
 * Подавить следующий toast для указанного тикета на указанное время (мс)
 * Вызывается из UI перед выполнением действия
 */
export function suppressTicketToast(ticketId: number, durationMs: number = 2000) {
  suppressedToastsMap.set(ticketId, Date.now() + durationMs);
}

/**
 * Проверить, нужно ли подавить toast для тикета
 */
function shouldSuppressToast(ticketId: number): boolean {
  const suppressUntil = suppressedToastsMap.get(ticketId);
  if (suppressUntil && Date.now() < suppressUntil) {
    return true;
  }
  // Очистить устаревшую запись
  if (suppressUntil) {
    suppressedToastsMap.delete(ticketId);
  }
  return false;
}

/**
 * Hook для подписки на обновления конкретного тикета через WebSocket
 * Показывает toast при изменениях тикета
 * При смене исполнителя — выкидывает предыдущего специалиста
 */
export function useTicketWebSocket(options: UseTicketWebSocketOptions) {
  const {
    ticketId,
    currentTicket,
    onTicketUpdate,
    onTicketDeleted,
    user,
    enabled = true,
    showToasts = true,
  } = options;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { isConnected, subscribeToTicketUpdates, subscribeToTicketDeleted } =
    useWebSocket();

  const updateCallbackRef = useRef(onTicketUpdate);
  const deleteCallbackRef = useRef(onTicketDeleted);
  const currentTicketRef = useRef(currentTicket);
  const currentUserRef = useRef(user);

  // Keep refs updated
  useEffect(() => {
    updateCallbackRef.current = onTicketUpdate;
    deleteCallbackRef.current = onTicketDeleted;
    currentTicketRef.current = currentTicket;
    currentUserRef.current = user;
  }, [onTicketUpdate, onTicketDeleted, currentTicket, user]);

  // Generate toast message based on what changed
  const generateChangeMessage = useCallback(
    (oldTicket: Ticket | null, newTicket: Ticket): string | null => {
      if (!oldTicket) return null;

      // Check assignedTo first
      if (
        oldTicket.assignedTo?.id !== newTicket.assignedTo?.id &&
        newTicket.assignedTo
      ) {
        const name = newTicket.assignedTo.fio || newTicket.assignedTo.username;
        return `Тикет принял специалист: ${name}`;
      }

      // Status changed
      if (oldTicket.status !== newTicket.status) {
        return `Статус изменён: ${getStatusLabel(
          oldTicket.status
        )} → ${getStatusLabel(newTicket.status)}`;
      }

      // Support line changed
      if (
        oldTicket.supportLine?.id !== newTicket.supportLine?.id &&
        newTicket.supportLine
      ) {
        return `Тикет переадресован: ${newTicket.supportLine.name}`;
      }

      // Priority changed
      if (oldTicket.priority !== newTicket.priority) {
        return `Приоритет изменён: ${newTicket.priority}`;
      }

      // Title/Description changed
      if (oldTicket.title !== newTicket.title) {
        return "Заголовок тикета обновлён";
      }
      if (oldTicket.description !== newTicket.description) {
        return "Описание тикета обновлено";
      }

      return null;
    },
    []
  );

  // Subscribe to ticket updates
  useEffect(() => {
    if (!enabled || !isConnected || !ticketId) return;

    const unsubscribeUpdate = subscribeToTicketUpdates(
      ticketId,
      (updatedTicket: Ticket) => {
        const currentUser = currentUserRef.current;
        const oldTicket = currentTicketRef.current;

        // Check if current user is a specialist (not admin, not just user)
        const isSpecialist = currentUser?.specialist || false;
        const isAdmin = currentUser?.roles?.includes("ADMIN") || false;
        const isTicketCreator =
          currentUser?.id === updatedTicket.createdBy?.id;

        // If specialist and assignee changed to someone else — kick them out
        if (isSpecialist && !isAdmin && !isTicketCreator) {
          const wasAssignedToMe = oldTicket?.assignedTo?.id === currentUser?.id;
          const nowAssignedToMe =
            updatedTicket.assignedTo?.id === currentUser?.id;
          const assigneeChanged =
            oldTicket?.assignedTo?.id !== updatedTicket.assignedTo?.id;

          // Case 1: Was assigned to me, now assigned to someone else
          // Case 2: I was viewing unassigned ticket, now someone else took it
          if (assigneeChanged && !nowAssignedToMe && updatedTicket.assignedTo) {
            const newAssigneeName =
              updatedTicket.assignedTo.fio || updatedTicket.assignedTo.username;

            toast.warning(
              wasAssignedToMe
                ? `Тикет передан специалисту ${newAssigneeName}. Вы больше не имеете доступа.`
                : `Тикет принял специалист ${newAssigneeName}. Вы больше не имеете доступа.`
            );

            router.push("/dashboard/tickets");
            return; // Don't update state — we're leaving
          }
        }

        // Show toast for changes (if we're staying on the page)
        // Проверяем, нужно ли подавить toast (пользователь только что сам сделал это действие)
        const message = generateChangeMessage(oldTicket, updatedTicket);
        if (message && showToasts && !shouldSuppressToast(ticketId)) {
          toast.ticketUpdated(ticketId, message);
        }

        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });

        // Update ticket state
        updateCallbackRef.current?.(updatedTicket);
      }
    );

    const unsubscribeDeleted = subscribeToTicketDeleted(ticketId, () => {
      if (showToasts && !shouldSuppressToast(ticketId)) {
        toast.warning(`Тикет #${ticketId} удалён`);
      }

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });

      deleteCallbackRef.current?.();
      router.push("/dashboard/tickets");
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeDeleted();
    };
  }, [
    enabled,
    isConnected,
    ticketId,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    generateChangeMessage,
    showToasts,
    router,
    queryClient,
  ]);

  return { isConnected };
}

// Helper function for status labels
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "Новый",
    OPEN: "Открыт",
    PENDING: "В ожидании",
    ESCALATED: "Эскалирован",
    RESOLVED: "Решён",
    PENDING_CLOSURE: "Ожидает закрытия",
    CLOSED: "Закрыт",
    REOPENED: "Переоткрыт",
    REJECTED: "Отклонён",
    CANCELLED: "Отменён",
  };
  return labels[status] || status;
}
