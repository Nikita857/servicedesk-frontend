"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers";
import { useAuthStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";
import { AnnouncementDialog } from "./AnnouncementDialog";
import { useMyAnnouncementsGateQuery } from "@/lib/hooks/announcements/useMyAnnouncementGateQuery";

/**
 * Обязательная модалка для непрочитанных активных объявлений (одна за раз, самые новые — первыми).
 * Источник истины — GET /announcements/my-gate (через useMyAnnouncementsGateQuery), а не WS-событие:
 * непрочитанные из прошлых сессий должны всплыть и при входе без WS-пуша, и при отключённых
 * in-app уведомлениях для этого типа (saveAndPush на бэке их в этом случае не пришлёт).
 * WS ANNOUNCEMENT_CREATED здесь — только триггер мгновенной инвалидации; polling в
 * useMyAnnouncementsGateQuery — fallback на случай разрыва соединения.
 * Бэк уже фильтрует и сортирует (непрочитанные + активные, createdAt DESC) — берём первый элемент страницы.
 */
export function AnnouncementGate() {
  const { user } = useAuthStore();
  const { isConnected, subscribeToUserNotifications } = useWebSocket();
  const queryClient = useQueryClient();
  const { data: announcements } = useMyAnnouncementsGateQuery();

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribeToUserNotifications(
      user.id,
      (notification) => {
        if (notification.type === "ANNOUNCEMENT_CREATED") {
          queryClient.invalidateQueries({
            queryKey: queryKeys.announcements.gate(),
          });
        }
      },
    );
    return () => unsubscribe();
  }, [isConnected, user?.id, subscribeToUserNotifications, queryClient]);

  const next = announcements?.content?.[0] ?? null;

  return (
    <AnnouncementDialog announcement={next} mandatory onClose={() => {}} />
  );
}
