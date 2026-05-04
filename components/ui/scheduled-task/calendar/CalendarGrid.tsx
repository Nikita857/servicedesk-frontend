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
export default function CalendarGrid({
  month,
  byDay,
  isLoading,
  onDayClick,
}: IProps) {
  return (
    <>
      {isLoading ? (
        <Flex justify="center" align="center" h="400px">
          <Spinner />
        </Flex>
      ) : (
        <Box>
          {/* Шапка дней недели */}
          <Grid templateColumns="repeat(7, 1fr)" mb={1}>
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <Text
                key={day}
                textAlign="center"
                fontSize="xs"
                fontWeight="medium"
                color="fg.muted"
                py={1}
              >
                {day}
              </Text>
            ))}
          </Grid>

          {/* Сетка дней */}
          <Grid templateColumns="repeat(7, 1fr)" gap={{ base: "1px", md: 1 }}>
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
      )}
    </>
  );
}
