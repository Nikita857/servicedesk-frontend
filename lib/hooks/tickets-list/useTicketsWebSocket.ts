import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers";
import { toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ticket } from "@/types/ticket";
import type { TicketListItem } from "@/types/ticket";

interface UseTicketsWebSocketOptions {
  onNewTicket?: (ticket: TicketListItem) => void;
  enabled?: boolean;
}

/**
 * Hook для подписки на новые тикеты через WebSocket
 * Показывает toast при создании нового тикета
 */
export function useTicketsWebSocket(options: UseTicketsWebSocketOptions = {}) {
  const { onNewTicket, enabled = true } = options;
  const { isConnected, subscribeToNewTickets } = useWebSocket();
  const queryClient = useQueryClient();
  const callbackRef = useRef(onNewTicket);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onNewTicket;
  }, [onNewTicket]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const unsubscribe = subscribeToNewTickets((ticket: Ticket) => {
      // Convert Ticket to TicketListItem format for the list
      const listItem: TicketListItem = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        createdByUsername: ticket.createdBy?.username || "",
        assignedToUsername: ticket.assignedTo?.username || null,
        supportLineName: ticket.supportLine?.name || null,
        createdAt: ticket.createdAt,
        slaDeadline: ticket.slaDeadline,
      };

      // Notify via toast
      toast.newTicket(ticket.id, ticket.title);

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });

      // Call the callback to add ticket to list
      callbackRef.current?.(listItem);
    });

    return unsubscribe;
  }, [enabled, isConnected, subscribeToNewTickets]);

  return { isConnected };
}
