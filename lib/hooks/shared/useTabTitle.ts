import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api/stats";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { ticketStatusConfig } from "@/types/ticket";

const BASE_TITLE = "ServiceDesk";
const FRAME_INTERVAL = 2000;

// Статусы, которые показываем в заголовке (исключаем NEW и финальные)
const ACTIVE_STATUSES = new Set([
  "OPEN",
  "PENDING",
  "ESCALATED",
  "RESOLVED",
  "PENDING_CLOSURE",
  "REOPENED",
]);

function statusLabel(status: string): string {
  return (
    ticketStatusConfig[status as keyof typeof ticketStatusConfig]?.label ??
    status
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

interface TabTitleOptions {
  isAdmin: boolean;
  isSpecialist: boolean;
}

export function useTabTitle({ isAdmin, isSpecialist }: TabTitleOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);

  const enabled = isAdmin || isSpecialist;

  // Профессиональная статистика (admin → global, specialist → my line)
  const { data: proStats } = useQuery({
    queryKey: isAdmin ? queryKeys.stats.global() : queryKeys.stats.my(),
    queryFn: isAdmin
      ? () => statsApi.getGlobalStats()
      : () => statsApi.getMyStats(),
    enabled,
    refetchInterval: 300 * 1000,
    staleTime: 300 * 1000,
  });

  // Тикеты, созданные лично (admin/specialist как автор + user)
  const { data: myTicketsPage } = useQuery({
    queryKey: [...queryKeys.tickets.all, "my-tab-title"],
    queryFn: () => ticketApi.listMy(0, 10),
    refetchInterval: 300 * 1000,
    staleTime: 300 * 1000,
  });

  useEffect(() => {
    const clearAnim = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const myTickets = myTicketsPage?.content ?? [];
    const frames: string[] = [];

    if (isAdmin || isSpecialist) {
      // Кол-во новых тикетов (глобально для admin, по линии для specialist)
      const newCount = proStats?.byStatus?.["NEW"] ?? 0;
      if (newCount > 0) {
        frames.push(`(${newCount}) новых — ${BASE_TITLE}`);
      }

      // Собственные тикеты в активных статусах (кроме NEW)
      const activeOwn = myTickets.filter((t) => ACTIVE_STATUSES.has(t.status));
      for (const t of activeOwn) {
        frames.push(`#${t.id} ${statusLabel(t.status)} — ${BASE_TITLE}`);
      }
    } else {
      // Обычный пользователь — последний тикет в активном статусе
      const latest = myTickets.find((t) => ACTIVE_STATUSES.has(t.status));
      if (latest) {
        frames.push(
          `#${latest.id}: ${truncate(latest.title, 25)} · ${statusLabel(latest.status)}`,
        );
      }
    }

    if (frames.length === 0) {
      document.title = BASE_TITLE;
      clearAnim();
      return;
    }

    // Цикл: frame[0] → BASE_TITLE → frame[1] → BASE_TITLE → ...
    const sequence: string[] = [];
    for (const f of frames) {
      sequence.push(f);
      sequence.push(BASE_TITLE);
    }

    clearAnim();
    frameRef.current = 0;
    document.title = sequence[0];

    intervalRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % sequence.length;
      document.title = sequence[frameRef.current];
    }, FRAME_INTERVAL);

    return clearAnim;
  }, [isAdmin, isSpecialist, proStats, myTicketsPage]);

  useEffect(() => {
    return () => {
      document.title = BASE_TITLE;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
