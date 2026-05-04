import { priorityColor } from "@/lib/utils/calendarUtils";
import { formatTime } from "@/lib/utils/formatters";
import {
  ScheduledTaskOccurrenceResponse,
  ScheduledTaskStatus,
} from "@/types/scheduler";
import { Box, Text } from "@chakra-ui/react";
import { LuRepeat } from "react-icons/lu";

interface IProps {
  occurrence: ScheduledTaskOccurrenceResponse;
}

function chipColor(
  status: ScheduledTaskStatus,
  priority: ScheduledTaskOccurrenceResponse["priority"],
) {
  switch (status) {
    case "OVERDUE":
      return { bg: "red.100", fg: "red.700" };
    case "COMPLETED_LATE":
      return { bg: "orange.100", fg: "orange.700" };
    case "EXECUTED":
      return { bg: "green.100", fg: "green.700" };
    case "CANCELLED":
      return { bg: "gray.100", fg: "gray.500" };
    default:
      return priorityColor(priority);
  }
}

export default function OccurrenceChip({ occurrence }: IProps) {
  const colors = chipColor(occurrence.taskStatus, occurrence.priority);
  const isStrikethrough =
    occurrence.ticketStatus !== null && occurrence.ticketStatus === "CLOSED";

  return (
    <>
      {/* Мобильный вид: тонкая цветная полоска */}
      <Box
        display={{ base: "block", md: "none" }}
        h="5px"
        borderRadius="full"
        bg={colors.bg}
        borderWidth="1px"
        borderColor={colors.fg}
        opacity={0.85}
      />

      {/* Десктопный вид: полноценный чип с текстом */}
      <Box
        as="span"
        display={{ base: "none", md: "flex" }}
        alignItems="center"
        gap={1}
        px={1}
        py="1px"
        borderRadius="sm"
        fontSize="xs"
        bg={colors.bg}
        color={colors.fg}
        textDecoration={isStrikethrough ? "line-through" : "none"}
        cursor="pointer"
        overflow="hidden"
      >
        {occurrence.recurrenceType !== "NONE" && <LuRepeat size={10} />}
        <Text as="span" flexShrink={0} fontSize="xs">
          {formatTime(occurrence.occurrenceAt)}
        </Text>
        <Text as="span" truncate>
          {occurrence.title}
        </Text>
      </Box>
    </>
  );
}
