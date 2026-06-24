"use client";

import { HStack, Text } from "@chakra-ui/react";
import { LuUserCheck, LuUserX } from "react-icons/lu";
import type { TicketListResponse, TicketStatus } from "@/types/ticket";

interface HandlerInfo {
  label: string;
  color: string;
  taken: boolean;
}

/**
 * Единый источник правды «кто занимается заявкой» для всех списков тикетов.
 * Авторитет «кто держит тикет» — поле `ticket.handler` (= ticket.assignedTo User
 * на бэке): оно проставляется при любом взятии в работу (takeTicket / accept /
 * прямое назначение), даже когда истории назначений нет. Последнее назначение
 * (`ticket.assignedTo` в DTO) используется лишь для PENDING-резерва (планировщик).
 * - handler есть                          → исполнитель держит заявку (зелёный, имя);
 * - handler нет, но PENDING-назначение    → зарезервирована, ещё не принял (жёлтый, «Ожидает: имя»);
 * - ни того, ни другого + активный статус → свободна (серый, «В пуле»).
 * Для ESCALATED возвращает null — там показывается цель эскалации отдельно.
 */
export function getTicketHandler(
  ticket: TicketListResponse,
): HandlerInfo | null {
  if (ticket.status === "ESCALATED") return null;

  // 1. Заявку реально держит исполнитель (авторитетный источник).
  if (ticket.handler) {
    const name = ticket.handler.fio ?? ticket.handler.username;
    return { label: name, color: "green", taken: true };
  }

  // 2. Зарезервирована за специалистом, но ещё не взята (напр. планировщик).
  const a = ticket.assignedTo;
  if (a?.toUser && a.status === "PENDING") {
    const name = a.toUser.fio ?? a.toUser.username;
    return { label: `Ожидает: ${name}`, color: "yellow", taken: true };
  }

  // 3. Свободна — в пуле линии.
  const active: TicketStatus[] = ["NEW", "OPEN", "PENDING", "REOPENED"];
  return active.includes(ticket.status)
    ? { label: "В пуле", color: "gray", taken: false }
    : null;
}

export function TicketHandlerBadge({ ticket }: { ticket: TicketListResponse }) {
  const handler = getTicketHandler(ticket);
  if (!handler) return null;

  return (
    <HStack gap={1} color={`${handler.color}.600`} fontSize="xs" minW={0}>
      {handler.taken ? <LuUserCheck size={11} /> : <LuUserX size={11} />}
      <Text truncate>{handler.label}</Text>
    </HStack>
  );
}
