import { useCancelScheduledTask } from "@/lib/hooks/scheduled-tasks/useCancelScheduledTask";
import {
  useSetOccurrenceDeadline,
  useClearOccurrenceDeadline,
} from "@/lib/hooks/scheduled-tasks";
import { formatDate, formatTime } from "@/lib/utils/formatters";
import {
  ScheduledTaskOccurrenceResponse,
  TASK_STATUS_CONFIG,
} from "@/types/scheduler";
import { ticketStatusConfig } from "@/types/ticket";
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuCalendar,
  LuPencil,
  LuPlus,
  LuRepeat,
  LuTrash2,
  LuTicket,
  LuUser,
  LuX,
  LuClock,
} from "react-icons/lu";
import Link from "next/link";
import { useState } from "react";
import { Tooltip } from "../../tooltip";

interface IProps {
  date: Date | null;
  occurrences: ScheduledTaskOccurrenceResponse[];
  onClose: () => void;
  onCreate: (date: Date) => void;
  onEditTask: (taskId: number) => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Ежедневно",
  WEEKLY: "Еженедельно",
  MONTHLY: "Ежемесячно",
};

export default function DayDrawer({
  date,
  occurrences,
  onClose,
  onCreate,
  onEditTask,
}: IProps) {
  const cancelMutation = useCancelScheduledTask();
  function buildDefaultTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  const dayTitle = date
    ? date.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Drawer.Root
      open={date !== null}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="420px">
            <Drawer.Header borderBottomWidth="1px">
              <Drawer.Title>
                {dayTitle.charAt(0).toUpperCase() + dayTitle.slice(1)}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm" aria-label="Закрыть">
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body py={4}>
              {occurrences.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="200px"
                  gap={2}
                >
                  <LuCalendar size={32} style={{ opacity: 0.3 }} />
                  <Text color="fg.muted" fontSize="sm">
                    На этот день задач нет
                  </Text>
                </Flex>
              ) : (
                <VStack gap={3} align="stretch">
                  {occurrences.map((occ, i) => (
                    <OccurrenceCard
                      key={`${occ.taskId}-${occ.occurrenceAt}-${i}`}
                      occurrence={occ}
                      onEdit={() => onEditTask(occ.taskId)}
                      onCancel={() => cancelMutation.mutate(occ.taskId)}
                      isCancelPending={cancelMutation.isPending}
                    />
                  ))}
                </VStack>
              )}
            </Drawer.Body>

            <Drawer.Footer borderTopWidth="1px">
              <Button
                w="full"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
                onClick={() => date && onCreate(buildDefaultTime(date))}
              >
                <LuPlus /> Создать на эту дату
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

function OccurrenceCard({
  occurrence,
  onEdit,
  onCancel,
  isCancelPending,
}: {
  occurrence: ScheduledTaskOccurrenceResponse;
  onEdit: () => void;
  onCancel: () => void;
  isCancelPending: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setDeadline = useSetOccurrenceDeadline();
  const clearDeadline = useClearOccurrenceDeadline();
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState("");

  // Видимость действий — на уровне задачи/шаблона, не вхождения
  const canEditDeadline =
    occurrence.recurrenceType !== "NONE" &&
    occurrence.taskStatus !== "CANCELLED";
  const canManageTemplate =
    occurrence.isVirtual &&
    occurrence.taskStatus !== "CANCELLED" &&
    occurrence.taskStatus !== "EXECUTED" &&
    occurrence.taskStatus !== "COMPLETED_LATE";
  const hasActions = canEditDeadline || canManageTemplate;

  return (
    <Box borderWidth="1px" borderColor="border.default" borderRadius="lg" p={3}>
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Text
          fontWeight="medium"
          fontSize="sm"
          textDecoration={
            ["EXECUTED", "COMPLETED_LATE", "CANCELLED"].includes(
              occurrence.occurrenceStatus,
            )
              ? "line-through"
              : "none"
          }
          flex={1}
          mr={2}
        >
          {formatTime(occurrence.occurrenceAt)} · {occurrence.title}
        </Text>
        <HStack gap={1} flexShrink={0}>
          {occurrence.occurrenceStatus && (
            <Tooltip content="Статус вхождения">
              <Badge
                colorPalette={
                  TASK_STATUS_CONFIG[occurrence.occurrenceStatus].color
                }
                variant={
                  TASK_STATUS_CONFIG[occurrence.occurrenceStatus].variant
                }
                fontSize="xs"
              >
                {TASK_STATUS_CONFIG[occurrence.occurrenceStatus].label}
              </Badge>
            </Tooltip>
          )}
          {canManageTemplate && (
            <Tooltip content="Отменить задачу">
              <IconButton
                aria-label="Отменить задачу"
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => setConfirmOpen(true)}
              >
                <LuTrash2 />
              </IconButton>
            </Tooltip>
          )}
        </HStack>
      </Flex>

      {/* ── Инфо-блок: метаданные + тикет, перенос строк ──────────────── */}
      <Flex
        wrap="wrap"
        rowGap={1.5}
        columnGap={3}
        align="center"
        fontSize="xs"
        color="fg.muted"
      >
        {occurrence.recurrenceType !== "NONE" && (
          <HStack gap={1}>
            <LuRepeat size={12} />
            <Text>{RECURRENCE_LABELS[occurrence.recurrenceType]}</Text>
          </HStack>
        )}
        {occurrence.assignTo && (
          <HStack gap={1}>
            <LuUser size={12} />
            <Text>
              {occurrence.assignTo.fio ?? occurrence.assignTo.username}
            </Text>
          </HStack>
        )}
        {occurrence.deadlineAt && (
          <HStack
            gap={1}
            color={
              occurrence.occurrenceStatus === "OVERDUE" ? "red.500" : "fg.muted"
            }
          >
            <LuClock size={12} />
            <Text>до {formatDate(occurrence.deadlineAt)}</Text>
          </HStack>
        )}
        {occurrence.ticketId && occurrence.ticketStatus && (
          <HStack gap={1.5}>
            <LuTicket size={12} />
            <Link href={`/dashboard/tickets/${occurrence.ticketId}`}>
              <Text color="accent.600" _hover={{ textDecoration: "underline" }}>
                Тикет #{occurrence.ticketId}
              </Text>
            </Link>
            <Badge
              colorPalette={ticketStatusConfig[occurrence.ticketStatus].color}
              variant="subtle"
              size="sm"
            >
              {ticketStatusConfig[occurrence.ticketStatus].label}
            </Badge>
          </HStack>
        )}
      </Flex>

      {/* ── Футер действий: разделитель + кнопки в один ряд ────────────── */}
      {hasActions && (
        <Flex
          wrap="wrap"
          gap={2}
          mt={3}
          pt={3}
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          {canEditDeadline && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setDeadlineValue(
                  occurrence.deadlineAt
                    ? toLocalDateTimeString(occurrence.deadlineAt)
                    : "",
                );
                setDeadlineOpen(true);
              }}
            >
              <LuClock size={12} /> Изменить срок
            </Button>
          )}
          {canManageTemplate && (
            <Button size="xs" variant="outline" onClick={onEdit}>
              <LuPencil size={12} /> Открыть шаблон
            </Button>
          )}
        </Flex>
      )}

      <Dialog.Root
        open={confirmOpen}
        onOpenChange={(e) => !e.open && setConfirmOpen(false)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Отменить задачу?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Задача <strong>«{occurrence.title}»</strong> будет отменена.
                  Все будущие вхождения не создадутся.
                </Text>
                <Text color="fg.muted" fontSize="sm" mt={2}>
                  Это действие нельзя отменить.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={isCancelPending}
                >
                  Нет
                </Button>
                <Button
                  colorPalette="red"
                  loading={isCancelPending}
                  onClick={() => {
                    onCancel();
                    setConfirmOpen(false);
                  }}
                >
                  Да, отменить
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={deadlineOpen}
        onOpenChange={(e) => !e.open && setDeadlineOpen(false)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Срок выполнения · {occurrence.title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontSize="sm" color="fg.muted" mb={2}>
                  Срок применится только к этому дню (
                  {formatDate(occurrence.occurrenceAt)}). Остальные вхождения не
                  изменятся.
                </Text>
                <input
                  type="datetime-local"
                  value={deadlineValue}
                  onChange={(e) => setDeadlineValue(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--chakra-colors-border-default)",
                    background: "var(--chakra-colors-bg-subtle)",
                    fontSize: "14px",
                    color: "var(--chakra-colors-fg-default)",
                  }}
                />
              </Dialog.Body>
              <Dialog.Footer>
                {occurrence.deadlineAt && (
                  <Button
                    variant="outline"
                    colorPalette="red"
                    mr="auto"
                    loading={clearDeadline.isPending}
                    onClick={() =>
                      clearDeadline.mutate(
                        {
                          id: occurrence.taskId,
                          occurrenceAt: occurrence.occurrenceAt,
                        },
                        { onSuccess: () => setDeadlineOpen(false) },
                      )
                    }
                  >
                    Сбросить
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDeadlineOpen(false)}>
                  Отмена
                </Button>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  loading={setDeadline.isPending}
                  disabled={!deadlineValue}
                  onClick={() =>
                    setDeadline.mutate(
                      {
                        id: occurrence.taskId,
                        body: {
                          occurrenceAt: occurrence.occurrenceAt,
                          deadlineAt: new Date(deadlineValue).toISOString(),
                        },
                      },
                      { onSuccess: () => setDeadlineOpen(false) },
                    )
                  }
                >
                  Сохранить
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}

function toLocalDateTimeString(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
