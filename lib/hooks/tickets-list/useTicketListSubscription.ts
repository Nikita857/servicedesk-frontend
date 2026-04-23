import { useEffect, useRef } from "react";
import { QueryClient, QueryKey, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { queryKeys } from "@/lib/queryKeys";
import { TicketListEventWS } from "@/types";
import type { PagedTicketList } from "@/types/ticket";

interface UseTicketListSubscriptionOptions {
  /**
   * Префикс queryKey списков, которые нужно обновлять.
   * Обычно queryKeys.tickets.lists(). Все кеши, чей ключ начинается
   * с этого префикса, будут затронуты через setQueriesData/invalidateQueries.
   */
  queryKey: QueryKey;
  /**
   * Локальный фильтр: если вернёт false — событие игнорируется.
   * Используется, чтобы вьюха реагировала только на "свои" тикеты
   * (по assigneeId, supportLineId и т.п.).
   */
  filter?: (event: TicketListEventWS) => boolean;
  /**
   * Побочные эффекты — тосты, плавные UI-анимации.
   * Вызывается после применения события к кешу.
   */
  onEvent?: (event: TicketListEventWS) => void;
  enabled?: boolean;
}

/**
 * Единая подписка на агрегированный поток /topic/tickets.
 * Заменяет множественные per-ticket STOMP-подписки в списочных вьюхах.
 * Out-of-order события отбрасываются по timestamp.
 */
export function useTicketListSubscription(
  options: UseTicketListSubscriptionOptions,
): void {
  const { queryKey, filter, onEvent, enabled = true } = options;
  const { isConnected, subscribeToTickets } = useWebSocket();
  const queryClient = useQueryClient();

  const filterRef = useRef(filter);
  const onEventRef = useRef(onEvent);
  const lastSeenRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    filterRef.current = filter;
    onEventRef.current = onEvent;
  }, [filter, onEvent]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const unsubscribe = subscribeToTickets((event) => {
      console.log("[tickets-list] received", event);
      const prev = lastSeenRef.current.get(event.id);

      if (prev && event.timestamp <= prev) {
        console.log("[tickets-list] dropped by timestamp", {
          prev,
          cur: event.timestamp,
        });
        return;
      }

      lastSeenRef.current.set(event.id, event.timestamp);

      if (filterRef.current && !filterRef.current(event)) {
        console.log("[tickets-list] dropped by filter", event);
        return;
      }

      applyEventToCache(queryClient, queryKey, event);
      onEventRef.current?.(event);
    });

    return unsubscribe;
  }, [enabled, isConnected, subscribeToTickets, queryClient, queryKey]);
}

function applyEventToCache(
  queryClient: QueryClient,
  listQueryKey: QueryKey,
  event: TicketListEventWS,
): void {
  console.log("[tickets-list] apply", {
    eventType: event.eventType,
    id: event.id,
    listKey: listQueryKey,
  });
  switch (event.eventType) {
    case "CREATED":
      // Агрегированный payload не содержит title/priority/createdByUsername —
      // для отрисовки новой строки нужен re-fetch.
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      return;

    case "DELETED":
      queryClient.setQueriesData<PagedTicketList>(
        { queryKey: listQueryKey },
        (old) => removeFromList(old, event.id),
      );
      queryClient.removeQueries({
        queryKey: queryKeys.tickets.detail(event.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      return;

    case "STATUS_CHANGED":
    case "ASSIGNED":
    case "UPDATED":
    case "RATED":
      console.log(
        "[tickets-list] invalidating",
        listQueryKey,
        "for event",
        event.eventType,
      );
      // В payload только assigneeId — имени/аватара нет. Берём через invalidate.
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(event.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      return;

    case "ESTIMATED_DATE_SET":
      // TicketListResponse не отображает estimatedCompletionDate — в списках no-op.
      // Detail-страница сама слушает /topic/ticket/{id}.
      return;

    default:
      // MESSAGE_SENT / MESSAGE_UPDATED / INTERNAL_COMMENT / ATTACHMENT_ADDED /
      // ASSIGNMENT_CREATED / ASSIGNMENT_REJECTED в /topic/tickets не приходят.
      return;
  }
}

function removeFromList(
  old: PagedTicketList | undefined,
  id: number,
): PagedTicketList | undefined {
  if (!old || !Array.isArray((old as PagedTicketList).content)) return old;
  const content = old.content.filter((t) => t.id !== id);
  if (content.length === old.content.length) return old;
  return {
    ...old,
    content,
    page: {
      ...old.page,
      totalElements: Math.max(0, old.page.totalElements - 1),
    },
  };
}
