"use client";

import { useEffect } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import CalendarView from "@/components/ui/scheduled-task/calendar/CalendarView";

export default function ScheduledTasksPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN");

  useEffect(() => {
    if (isHydrated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isHydrated, isAdmin, router]);

  if (!isHydrated) return null;
  if (!isAdmin) return null;

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
