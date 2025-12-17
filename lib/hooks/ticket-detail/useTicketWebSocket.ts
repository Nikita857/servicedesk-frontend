import { useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "@/lib/providers";
import { toaster } from "@/components/ui/toaster";
import type { Ticket } from "@/types/ticket";

interface UseTicketWebSocketOptions {
  ticketId: number;
  currentTicket: Ticket | null;
  onTicketUpdate?: (ticket: Ticket) => void;
  onTicketDeleted?: () => void;
  enabled?: boolean;
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
    enabled = true,
  } = options;

  const { isConnected, subscribeToTicketUpdates, subscribeToTicketDeleted } = useWebSocket();
  const updateCallbackRef = useRef(onTicketUpdate);
  const deleteCallbackRef = useRef(onTicketDeleted);
  const currentTicketRef = useRef(currentTicket);

  // Keep refs updated
  useEffect(() => {
    updateCallbackRef.current = onTicketUpdate;
    deleteCallbackRef.current = onTicketDeleted;
    currentTicketRef.current = currentTicket;
  }, [onTicketUpdate, onTicketDeleted, currentTicket]);

  // Generate toast message based on what changed
  const generateChangeMessage = useCallback(
    (oldTicket: Ticket | null, newTicket: Ticket): string | null => {
      if (!oldTicket) return null;

      // Status changed
      if (oldTicket.status !== newTicket.status) {
        return `Статус изменён: ${getStatusLabel(oldTicket.status)} → ${getStatusLabel(newTicket.status)}`;
      }

      // Assigned to specialist
      if (
        oldTicket.assignedTo?.username !== newTicket.assignedTo?.username &&
        newTicket.assignedTo
      ) {
        const name = newTicket.assignedTo.fio || newTicket.assignedTo.username;
        return `Тикет взят в работу: ${name}`;
      }

      // Support line changed
      if (oldTicket.supportLine?.id !== newTicket.supportLine?.id && newTicket.supportLine) {
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

    const unsubscribeUpdate = subscribeToTicketUpdates(ticketId, (updatedTicket: Ticket) => {
      const message = generateChangeMessage(currentTicketRef.current, updatedTicket);
      
      if (message) {
        toaster.info({
          title: `Тикет #${ticketId}`,
          description: message,
          closable: true,
        });
      }

      updateCallbackRef.current?.(updatedTicket);
    });

    const unsubscribeDeleted = subscribeToTicketDeleted(ticketId, () => {
      toaster.warning({
        title: `Тикет #${ticketId} удалён`,
        closable: true,
      });
      deleteCallbackRef.current?.();
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
