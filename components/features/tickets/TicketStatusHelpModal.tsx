"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  CloseButton,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuCircleHelp, LuArrowRight } from "react-icons/lu";
import { ticketStatusConfig, type TicketStatus } from "@/types/ticket";

interface StatusEntry {
  status: TicketStatus;
  description: string;
  /** Кто должен действовать: "user" | "specialist" | null (терминальный) */
  turn?: "user" | "specialist";
  actionHint: string;
}

const STATUS_ENTRIES: StatusEntry[] = [
  {
    status: "NEW",
    description:
      "Заявка создана и ожидает, когда его возьмёт специалист. Никаких действий от вас не требуется.",
    turn: "specialist",
    actionHint: "Ожидайте назначения специалиста",
  },
  {
    status: "OPEN",
    description:
      "Специалист взял заявку в работу и занимается решением вашей проблемы.",
    turn: "specialist",
    actionHint: "Ведётся работа — можете уточнять детали в чате",
  },
  {
    status: "PENDING",
    description:
      "Специалист ожидает ответа или дополнительной информации от вас. Заявка «заморожена» до вашей реакции.",
    turn: "user",
    actionHint: "Ответьте в чате или предоставьте запрошенные данные",
  },
  {
    status: "ESCALATED",
    description:
      "Заявка передана на другую линию поддержки и ожидает когда ее возьмет в работу другой специалист",
    turn: "specialist",
    actionHint: "Ожидайте — специалист возьмет заявку в работу и статус обновится на 'В работе' ",
  },
  {
    status: "RESOLVED",
    description:
      "Специалист считает проблему решённой и ожидает от вас обратной связи. Сообщите специалисту состояние вашей проблемы",
    turn: "user",
    actionHint: "Проверьте результат работы специалиста и сообщите в чате что проблема решена",
  },
  {
    status: "PENDING_CLOSURE",
    description:
      'Специалист запросил закрытие заявки. Это «промежуточный» статус перед закрытием — у вас есть возможность подтвердить решение или вернуть заявку в работу.',
    turn: "user",
    actionHint: "Подтвердите закрытие или переоткройте заявку",
  },
  {
    status: "CLOSED",
    description:
      "Заявка закрыта. Проблема решена и подтверждена. История переписки и файлы сохраняются.",
    actionHint: "Если проблема вернулась — создайте новую заявку",
  },
  {
    status: "REOPENED",
    description:
      "Заявка была закрыта или решена, но затем переоткрыта — например, потому что проблема не исчезла или появилась снова.",
    turn: "specialist",
    actionHint: "Тикет снова в работе",
  },
  {
    status: "REJECTED",
    description:
      "Заявка отклонён специалистом. Причина обычно указана в комментарие переадресации — например, обращение не соответствует профилю данной линии поддержки.",
    actionHint: "Если не согласны — обратитесь к администратору или создайте новую заявку",
  },
  {
    status: "CANCELLED",
    description: "Заявка отменена создателем. Дальнейшая работа по ней не ведётся.",
    actionHint: "Если передумали — создайте новую",
  },
];

const TURN_BADGE: Record<"user" | "specialist", { label: string; color: string }> = {
  user: { label: "Ваш ход", color: "blue" },
  specialist: { label: "Ждите специалиста", color: "green" },
};

export function TicketStatusHelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        aria-label="Справка по статусам"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        title="Справка по статусам заявок"
      >
        <LuCircleHelp />
      </IconButton>

      <Dialog.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        scrollBehavior="inside"
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header pb={2}>
                <Dialog.Title fontSize="md">
                  Справка по статусам заявок
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body pb={6}>
                <Text color="fg.muted" fontSize="sm" mb={4}>
                  Статус показывает, на каком этапе находится ваша заявка и кто
                  должен действовать дальше.
                </Text>

                <VStack gap={3} align="stretch">
                  {STATUS_ENTRIES.map(
                    ({ status, description, turn, actionHint }) => {
                      const conf = ticketStatusConfig[status as TicketStatus];
                      const turnConf = turn ? TURN_BADGE[turn] : null;

                      return (
                        <Box
                          key={status}
                          borderWidth="1px"
                          borderColor="border.default"
                          borderRadius="lg"
                          p={3}
                          bg="bg.surface"
                        >
                          <Flex justify="space-between" align="flex-start" gap={2} mb={1}>
                            <Badge
                              colorPalette={conf.color}
                              size="sm"
                              flexShrink={0}
                            >
                              {conf.label}
                            </Badge>
                            {turnConf && (
                              <Badge
                                colorPalette={turnConf.color}
                                variant="subtle"
                                size="sm"
                                flexShrink={0}
                              >
                                {turnConf.label}
                              </Badge>
                            )}
                          </Flex>

                          <Text fontSize="sm" color="fg.default" mb={2}>
                            {description}
                          </Text>

                          <HStack gap={1.5}>
                            <LuArrowRight
                              size={12}
                              color="var(--chakra-colors-fg-muted)"
                            />
                            <Text fontSize="xs" color="fg.muted">
                              {actionHint}
                            </Text>
                          </HStack>
                        </Box>
                      );
                    }
                  )}
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
