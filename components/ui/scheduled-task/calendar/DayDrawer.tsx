import { useCancelScheduledTask } from "@/lib/hooks/scheduled-tasks/useCancelScheduledTask";
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

  return (
    <Box borderWidth="1px" borderColor="border.default" borderRadius="lg" p={3}>
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Text
          fontWeight="medium"
          fontSize="sm"
          textDecoration={
            ["CLOSED", "REJECTED", "CANCELLED"].includes(
              occurrence.ticketStatus ?? "",
            )
              ? "line-through"
              : "none"
          }
          flex={1}
          mr={2}
        >
          {formatTime(occurrence.occurrenceAt)} · {occurrence.title}
        </Text>
        {occurrence.taskStatus && (
          <Tooltip content="Статус задачи">
            <Badge
              colorPalette={TASK_STATUS_CONFIG[occurrence.taskStatus].color}
              variant={TASK_STATUS_CONFIG[occurrence.taskStatus].variant}
              fontSize="xs"
            >
              {TASK_STATUS_CONFIG[occurrence.taskStatus].label}
            </Badge>
          </Tooltip>
        )}
      </Flex>

      <HStack gap={3} fontSize="xs" color="fg.muted" mb={2}>
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
          <HStack gap={1}>
            <LuClock size={12} />
            <Text
              color={
                occurrence.taskStatus === "OVERDUE" ? "red.500" : "fg.muted"
              }
            >
              до {formatDate(occurrence.deadlineAt)}
            </Text>
          </HStack>
        )}
      </HStack>

      {occurrence.ticketId && occurrence.ticketStatus && (
        <HStack gap={2} mb={2} fontSize="xs">
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

      {occurrence.isVirtual &&
        occurrence.taskStatus !== "CANCELLED" &&
        occurrence.taskStatus !== "EXECUTED" &&
        occurrence.taskStatus !== "COMPLETED_LATE" && (
          <HStack gap={2} mt={1}>
            <Button size="xs" variant="outline" onClick={onEdit}>
              <LuPencil size={12} /> Открыть шаблон
            </Button>
            <Button
              size="xs"
              colorPalette="red"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
            >
              <LuTrash2 size={12} /> Отменить
            </Button>
          </HStack>
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
    </Box>
  );
}
