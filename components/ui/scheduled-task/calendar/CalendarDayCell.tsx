import { ScheduledTaskOccurrenceResponse } from "@/types/scheduler";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
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
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Адаптивно: мобильно показываем только полоски (компактнее), desktop — 3 чипа
  const visibleDesktop = occurrences.slice(0, 3);
  const hiddenDesktop = occurrences.length - visibleDesktop.length;

  // На мобиле показываем до 4 полосок
  const visibleMobile = occurrences.slice(0, 4);
  const hiddenMobile = occurrences.length - visibleMobile.length;

  return (
    <Box
      minH={{ base: "56px", md: "112px" }}
      p={{ base: "4px", md: "6px" }}
      borderWidth="1px"
      borderColor={isToday ? "blue.400" : "border.default"}
      borderRadius="md"
      bg={
        isToday
          ? "blue.50"
          : isCurrentMonth
            ? isWeekend
              ? "bg.subtle"
              : "bg.surface"
            : "bg.subtle"
      }
      opacity={isCurrentMonth ? 1 : 0.5}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: isToday ? "blue.100" : "bg.muted" }}
      transition="background 0.12s"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* ── Шапка ячейки: число + счётчик ──────────────────────────────── */}
      <Flex justify="space-between" align="center" mb={{ base: "2px", md: 1 }}>
        <Text
          fontSize={{ base: "xs", md: "sm" }}
          fontWeight={isToday ? "bold" : "medium"}
          color={
            isToday ? "blue.700" : isCurrentMonth ? "fg.default" : "fg.muted"
          }
          lineHeight="1"
        >
          {date.getDate()}
        </Text>

        {occurrences.length > 0 && (
          <Text
            fontSize="2xs"
            fontWeight="semibold"
            color="fg.subtle"
            display={{ base: "none", md: "block" }}
            fontVariantNumeric="tabular-nums"
          >
            {occurrences.length}
          </Text>
        )}
      </Flex>

      {/* ── Чипы: десктоп ──────────────────────────────────────────────── */}
      <VStack
        gap="2px"
        align="stretch"
        flex={1}
        minH={0}
        display={{ base: "none", md: "flex" }}
      >
        {visibleDesktop.map((occ, i) => (
          <OccurrenceChip
            key={`${occ.taskId}-${occ.occurrenceAt}-${i}`}
            occurrence={occ}
          />
        ))}
        {hiddenDesktop > 0 && (
          <Text fontSize="xs" color="fg.muted" pl={2} fontWeight="medium">
            +{hiddenDesktop} ещё
          </Text>
        )}
      </VStack>

      {/* ── Полоски: мобила ────────────────────────────────────────────── */}
      <VStack
        gap="2px"
        align="stretch"
        flex={1}
        minH={0}
        display={{ base: "flex", md: "none" }}
      >
        {visibleMobile.map((occ, i) => (
          <OccurrenceChip
            key={`${occ.taskId}-${occ.occurrenceAt}-${i}`}
            occurrence={occ}
          />
        ))}
        {hiddenMobile > 0 && (
          <Text fontSize="2xs" color="fg.muted" textAlign="center" mt="1px">
            +{hiddenMobile}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
