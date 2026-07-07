import { priorityColor } from "@/lib/utils/calendarUtils";
import { formatTime } from "@/lib/utils/formatters";
import {
  ScheduledTaskOccurrenceResponse,
  ScheduledTaskStatus,
} from "@/types/scheduler";
import { Box, Flex, Text } from "@chakra-ui/react";
import { LuRepeat } from "react-icons/lu";

interface IProps {
  occurrence: ScheduledTaskOccurrenceResponse;
}

// Цвет «акцента» (левый бордер + время) — по статусу, иначе по приоритету
function accentColor(
  status: ScheduledTaskStatus,
  priority: ScheduledTaskOccurrenceResponse["priority"],
): string {
  switch (status) {
    case "OVERDUE":
      return "red.500";
    case "COMPLETED_LATE":
      return "orange.500";
    case "EXECUTED":
      return "green.500";
    case "CANCELLED":
      return "gray.400";
    default:
      return priorityColor(priority).fg; // используем fg как насыщенный
  }
}

export default function OccurrenceChip({ occurrence }: IProps) {
  const accent = accentColor(occurrence.occurrenceStatus, occurrence.priority);

  const isDone =
    occurrence.occurrenceStatus === "EXECUTED" ||
    occurrence.occurrenceStatus === "COMPLETED_LATE";
  const isCancelled = occurrence.occurrenceStatus === "CANCELLED";
  const isOverdue = occurrence.occurrenceStatus === "OVERDUE";

  const isStrikethrough = isDone || isCancelled;

  return (
    <>
      {/* ── Мобильный вид: тонкая цветная полоска ───────────────────────── */}
      <Box
        display={{ base: "block", md: "none" }}
        h="4px"
        borderRadius="full"
        bg={accent}
        opacity={isDone || isCancelled ? 0.45 : 1}
      />

      {/* ── Десктопный вид: Left-Bar чип ─────────────────────────────────── */}
      <Flex
        display={{ base: "none", md: "flex" }}
        align="center"
        gap={1.5}
        pl={2}
        pr={1}
        py="1px"
        borderLeftWidth="3px"
        borderLeftColor={accent}
        bg={isOverdue ? "red.50" : "transparent"}
        fontSize="xs"
        lineHeight="16px"
        color={isDone || isCancelled ? "fg.muted" : "fg.default"}
        textDecoration={isStrikethrough ? "line-through" : "none"}
        cursor="pointer"
        overflow="hidden"
        _hover={{ bg: "bg.subtle" }}
        transition="background 0.12s"
      >
        {occurrence.recurrenceType !== "NONE" && (
          <Box flexShrink={0} color="fg.muted" display="flex">
            <LuRepeat size={10} />
          </Box>
        )}
        <Text
          as="span"
          flexShrink={0}
          fontSize="2xs"
          fontWeight="semibold"
          color={isOverdue ? accent : "fg.muted"}
          fontVariantNumeric="tabular-nums"
        >
          {formatTime(occurrence.occurrenceAt)}
        </Text>
        <Text as="span" truncate fontSize="xs">
          {occurrence.title}
        </Text>
      </Flex>
    </>
  );
}
