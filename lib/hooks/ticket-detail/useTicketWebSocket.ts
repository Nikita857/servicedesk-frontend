import { useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/lib/providers";
import { toast } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";
import router from "next/navigation";
import { User } from "@/types";

interface UseTicketWebSocketOptions {
  ticketId: number;
  currentTicket: Ticket | null;
  onTicketUpdate?: (ticket: Ticket) => void;
  onTicketDeleted?: () => void;
  user: User | null;
  enabled?: boolean;
  showToasts?: boolean; // Whether to show toast notifications for updates (default: true)
}

/**
 * Hook для подписки на обновления конкретного тикета через WebSocket
 * Показывает toast при изменениях тикета
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

  const { isConnected, subscribeToTicketUpdates, subscribeToTicketDeleted } = useWebSocket();

  const updateCallbackRef = useRef(onTicketUpdate);
  const deleteCallbackRef = useRef(onTicketDeleted);
  const currentTicketRef = useRef(currentTicket);
  const currentUser = useRef(user);

  // Keep refs updated
  useEffect(() => {
    updateCallbackRef.current = onTicketUpdate;
    deleteCallbackRef.current = onTicketDeleted;
    currentTicketRef.current = currentTicket;
    currentUser.current = user;
  }, [onTicketUpdate, onTicketDeleted, currentTicket, user]);

  // Generate toast message based on what changed
  const generateChangeMessage = useCallback(
    (oldTicket: Ticket | null, newTicket: Ticket): string | null => {
      if (!oldTicket) return null;

      // Check assignedTo first - "Ticket taken" is more specific than "status changed"
      // When specialist takes ticket, both assignedTo AND status change
      if (
        oldTicket.assignedTo?.username !== newTicket.assignedTo?.username &&
        newTicket.assignedTo
      ) {
        const name = newTicket.assignedTo.fio || newTicket.assignedTo.username;
        return `Тикет взят в работу: ${name}`;
      }

      // Status changed (only if not taken by someone)
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

      return "Тикет обновлён";
    },
    []
  );

  // Subscribe to ticket updates
  useEffect(() => {
    if (!enabled || !isConnected || !ticketId) return;

    const unsubscribeUpdate = subscribeToTicketUpdates(
      ticketId,
      (updatedTicket: Ticket) => {
        const message = generateChangeMessage(
          currentTicketRef.current,
          updatedTicket
        );

        if (message && showToasts) {
          toast.ticketUpdated(ticketId, message);
        }

        const currentUserId = currentUser.current?.id; // добавь useRef на текущего пользователя
        const isSpecialist = currentUser.current?.specialist || false;
        const isAdmin = currentUser.current?.roles.every((role) => role === 'ADMIN')
        const assignedToId = updatedTicket.assignedTo?.id;

        const hasAccess = !assignedToId || assignedToId === currentUserId || !isSpecialist;

      if (!hasAccess) {
        if(!isAdmin) {
          router.redirect("/dashboard/tickets");
        }
        if(currentUser?.current?.id === currentUserId) {
          toast.warning("У вас больше нет доустпа к этому тикету") 
        }
        return;
      }

        updateCallbackRef.current?.(updatedTicket);
      }
    );

    const unsubscribeDeleted = subscribeToTicketDeleted(ticketId, () => {
      if (showToasts) {
        toast.warning(`Тикет #${ticketId} удалён`);
      }
      deleteCallbackRef.current?.();
      router.redirect('/dashboard/tickets')
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
    currentTicket?.assignedTo?.id,
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
    CLOSED: "Закрыт",
    REOPENED: "Переоткрыт",
    REJECTED: "Отклонён",
    CANCELLED: "Отменён",
  };
  return labels[status] || status;
}
