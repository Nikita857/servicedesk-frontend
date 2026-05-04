import { ScheduledTaskOccurrenceResponse } from "@/types/scheduler";
import { Box, VStack, Text } from "@chakra-ui/react";
import OccurrenceChip from "./OccurrenceChip";
import { formatLocalDayKey } from "@/lib/utils/calendarUtils";

interface IProps {
  date: Date;
  currentMonth: Date;
  occurrences: ScheduledTaskOccurrenceResponse[];
  onClick: () => void;
}

export default function CalendarDayCell({
  date,
  currentMonth,
  occurrences,
  onClick,
}: IProps) {
  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
  const isToday = formatLocalDayKey(date) === formatLocalDayKey(new Date());
  const visible = occurrences.slice(0, 3);
  const hiddenCount = occurrences.length - visible.length;

  return (
    <Box
      minH={{ base: "52px", md: "100px" }}
      p={{ base: "2px", md: 1 }}
      borderWidth="1px"
      borderColor={isToday ? "blue.400" : "border.default"}
      borderRadius="md"
      bg={isToday ? "bg.subtle" : "bg.surface"}
      opacity={isCurrentMonth ? 1 : 0.45}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: isToday ? "blue.100" : "bg.subtle" }}
    >
      {/* Число дня */}
      <Text
        fontSize={{ base: "xs", md: "sm" }}
        fontWeight={isToday ? "bold" : "normal"}
        color={isToday ? "blue.600" : "fg.default"}
        mb={{ base: "2px", md: 1 }}
      >
        {date.getDate()}
      </Text>

      {/* Чипы */}
      <VStack gap="2px" align="stretch">
        {visible.map((occ, i) => (
          <OccurrenceChip
            key={`${occ.taskId}-${occ.occurrenceAt}-${i}`}
            occurrence={occ}
          />
        ))}
        {hiddenCount > 0 && (
          <Text
            fontSize="xs"
            color="fg.muted"
            pl={1}
            display={{ base: "none", md: "block" }}
          >
            +{hiddenCount} ещё
          </Text>
        )}
      </VStack>
    </Box>
  );
}
