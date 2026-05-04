"use client";

import { scheduledTasksApi } from "@/lib/api/scheduled-tasks";
import { useScheduledTasksCalendarQuery } from "@/lib/hooks/scheduled-tasks/useScheduledTasksCalendarQuery";
import {
  formatLocalDayKey,
  getMonthWindow,
  groupByLocalDay,
} from "@/lib/utils/calendarUtils";
import { ScheduledTaskResponse } from "@/types/scheduler";
import { Box } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import ScheduledTaskFormDialog from "../ScheduledTaskFormDialog";
import CalendarGrid from "./CalendarGrid";
import CalendarHeader from "./CalendarHeader";
import DayDrawer from "./DayDrawer";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers";
import { queryKeys } from "@/lib/queryKeys";

export default function CalendarView() {
  /**
   * STATE
   */
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    prefilledDate?: string;
    task?: ScheduledTaskResponse;
  }>({ open: false });

  /**
   * DATA
   */

  const { from, to } = getMonthWindow(currentMonth);
  const { data, isLoading } = useScheduledTasksCalendarQuery({ from, to });
  const byDay = useMemo(() => groupByLocalDay(data ?? []), [data]);

  const queryClient = useQueryClient();
  const { isConnected, subscribeToTickets } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;
    return subscribeToTickets(() => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.scheduledTasks.all, "calendar"],
      });
    });
  }, [isConnected, subscribeToTickets, queryClient]);

  /**
   * NAVIGATION
   */
  const goToPrev = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNext = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCurrentMonth(d);
  };

  /**
   * EDIT TEMPLATE HANDLERS
   */
  const handleEditTask = async (taskId: number) => {
    const full = await scheduledTasksApi.getById(taskId);
    setSelectedDate(null);
    setFormDialog({ open: true, task: full });
  };

  /**
   * OPEN FROM IN DRAWER HANDLER
   */

  const handleCreateOnDate = (date: Date) => {
    setSelectedDate(null);
    setFormDialog({ open: true, prefilledDate: date.toISOString() });
  };

  return (
    <Box p={{ base: 2, md: 6 }}>
      <CalendarHeader
        month={currentMonth}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onCreate={() => setFormDialog({ open: true })}
      />
      <CalendarGrid
        month={currentMonth}
        byDay={byDay}
        isLoading={isLoading}
        onDayClick={setSelectedDate}
      />
      <DayDrawer
        date={selectedDate}
        occurrences={
          selectedDate ? (byDay.get(formatLocalDayKey(selectedDate)) ?? []) : []
        }
        onClose={() => setSelectedDate(null)}
        onCreate={handleCreateOnDate}
        onEditTask={handleEditTask}
      />
      <ScheduledTaskFormDialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false })}
        task={formDialog.task}
        prefilledDate={formDialog.prefilledDate}
      />
    </Box>
  );
}
