import { ScheduledTaskOccurrenceResponse } from "@/types/scheduler";
import { Box, Flex, Grid, Spinner, Text } from "@chakra-ui/react";
import CalendarDayCell from "./CalendarDayCell";
import { buildMonthMatrix, formatLocalDayKey } from "@/lib/utils/calendarUtils";

interface IProps {
  month: Date;
  byDay: Map<string, ScheduledTaskOccurrenceResponse[]>;
  isLoading: boolean;
  onDayClick: (date: Date) => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function CalendarGrid({
  month,
  byDay,
  isLoading,
  onDayClick,
}: IProps) {
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Шапка дней недели */}
      <Grid templateColumns="repeat(7, 1fr)" mb={2} px={{ base: 0, md: 1 }}>
        {WEEKDAYS.map((day, i) => (
          <Text
            key={day}
            textAlign="center"
            fontSize="2xs"
            fontWeight="semibold"
            color={i >= 5 ? "fg.subtle" : "fg.muted"}
            letterSpacing="wider"
            textTransform="uppercase"
            py={1}
          >
            {day}
          </Text>
        ))}
      </Grid>

      {/* Сетка дней */}
      <Grid
        templateColumns="repeat(7, 1fr)"
        gap={{ base: "2px", md: "4px" }}
        autoRows="1fr"
      >
        {buildMonthMatrix(month)
          .flat()
          .map((date, i) => (
            <CalendarDayCell
              key={i}
              date={date}
              currentMonth={month}
              occurrences={byDay.get(formatLocalDayKey(date)) ?? []}
              onClick={() => onDayClick(date)}
            />
          ))}
      </Grid>
    </Box>
  );
}
