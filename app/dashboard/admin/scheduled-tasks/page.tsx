"use client";

import { useEffect } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import CalendarView from "@/components/ui/scheduled-task/calendar/CalendarView";

export default function ScheduledTasksPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();

  useEffect(() => {
    if (isHydrated && !has(PERM.SCHEDULED_TASK_MANAGE)) {
      router.push("/dashboard");
    }
  }, [isHydrated, has, router]);

  if (!isHydrated) return null;
  if (!has(PERM.SCHEDULED_TASK_MANAGE)) return null;

  return (
    <Box>
      {/* Заголовок */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Планировщик задач
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Автоматическое создание тикетов по расписанию
          </Text>
        </Box>
      </Flex>

      {/* Календарь */}
      <CalendarView />
    </Box>
  );
}
