import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers";
import { toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ticket } from "@/types/ticket";
import type { TicketListResponse } from "@/types/ticket";

interface UseTicketsWebSocketOptions {
  onNewTicket?: (ticket: TicketListResponse) => void;
  enabled?: boolean;
  /**
   * Идентификаторы тикетов, отображаемых в списке в данный момент.
   * Для них будет оформлена подписка на обновления (status/assignee/...)
   * и удаления через per-ticket STOMP-топики. Без этого списки не
   * реагируют на изменения существующих тикетов — бэкенд публикует такие
   * события в /topic/ticket/{id}, а не в /topic/ticket/new.
   */
  ticketIds?: number[];
}

/**
 * Hook для подписки на события тикетов через WebSocket.
 * - Новые тикеты (/topic/ticket/new) — toast + invalidate списков/статистик.
 * - Обновления и удаления видимых тикетов (/topic/ticket/{id}[/deleted]) —
 *   чтобы списочные вьюхи перерисовывались мгновенно, а не раз в минуту.
 */
export function useTicketsWebSocket(options: UseTicketsWebSocketOptions = {}) {
  const { onNewTicket, enabled = true, ticketIds } = options;
  const {
    isConnected,
    subscribeToNewTickets,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
  } = useWebSocket();
  const queryClient = useQueryClient();
  const callbackRef = useRef(onNewTicket);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onNewTicket;
  }, [onNewTicket]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const unsubscribe = subscribeToNewTickets((ticket: Ticket) => {
      // Convert Ticket to TicketListResponse format for the list
      const listItem: TicketListResponse = {
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
  }, [enabled, isConnected, subscribeToNewTickets, queryClient]);

  // Подписка на per-ticket обновления/удаления для текущего набора видимых
  // тикетов. Стабилизируем зависимость по join(',') — эффект пересобирается
  // только когда меняется состав идентификаторов.
  const ticketIdsKey = (ticketIds ?? []).join(",");
  useEffect(() => {
    if (!enabled || !isConnected || !ticketIds || ticketIds.length === 0) return;
    const unsubs: Array<() => void> = [];
    for (const id of ticketIds) {
      unsubs.push(
        subscribeToTicketUpdates(id, (updated) => {
          queryClient.setQueryData(queryKeys.tickets.detail(id), updated);
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        }),
      );
      unsubs.push(
        subscribeToTicketDeleted(id, () => {
          queryClient.removeQueries({ queryKey: queryKeys.tickets.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
          queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
        }),
      );
    }
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    isConnected,
    ticketIdsKey,
    subscribeToTicketUpdates,
    subscribeToTicketDeleted,
    queryClient,
  ]);

  return { isConnected };
}
