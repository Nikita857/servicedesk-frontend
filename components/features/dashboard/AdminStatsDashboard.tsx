"use client";

import { useState } from "react";
import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Icon,
  VStack,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { LuGlobe, LuInbox } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { TicketListModal } from "./TicketListModal";
import { StatBox, LineStatsCard } from "./DashboardStatComponents";
import type { TicketStatus } from "@/types/ticket";

type ModalState = {
  isOpen: boolean;
  title: string;
  status: TicketStatus | null;
  lineId: number | null;
};

/**
 * Дашборд для администраторов
 * Показывает глобальную статистику и статистику по линиям поддержки
 */
export function AdminStatsDashboard() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    status: null,
    lineId: null,
  });

  // Глобальная статистика
  const { data: globalStats, isLoading: isGlobalLoading } = useQuery({
    queryKey: queryKeys.stats.global(),
    queryFn: () => statsApi.getGlobalStats(),
    staleTime: 60 * 1000,
  });

  // Статистика по линиям
  const { data: lineStatsResponse, isLoading: isLinesLoading } = useQuery({
    queryKey: queryKeys.stats.byAllLines(),
    queryFn: () => statsApi.getStatsByAllLines({ page: 0, size: 20 }),
    staleTime: 60 * 1000,
  });

  const lineStats = lineStatsResponse?.content;
  const isLoading = isGlobalLoading || isLinesLoading;

  const handleStatClick = (title: string, status: TicketStatus, lineId: number) => {
    setModal({ isOpen: true, title, status, lineId });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner />
      </Flex>
    );
  }

  const totalStats = [
    {
      label: "Новых",
      value: globalStats?.byStatus?.["NEW"] ?? 0,
      color: "blue.500",
      bgColor: "blue.50",
      darkBgColor: "blue.900/20",
      statusKey: "NEW" as TicketStatus,
    },
    {
      label: "В работе",
      value: globalStats?.open ?? 0,
      color: "orange.500",
      bgColor: "orange.50",
      darkBgColor: "orange.900/20",
      statusKey: "OPEN" as TicketStatus,
    },
    {
      label: "Закрыто",
      value: globalStats?.closed ?? 0,
      color: "gray.500",
      bgColor: "gray.50",
      darkBgColor: "gray.900/20",
      statusKey: "CLOSED" as TicketStatus,
    },
    {
      label: "Ожидание",
      value: globalStats?.waiting ?? 0,
      color: "yellow.500",
      bgColor: "yellow.50",
      darkBgColor: "yellow.900/20",
      statusKey: "PENDING" as TicketStatus,
    },
  ];

  return (
    <VStack align="stretch" gap={6}>
      {/* Общая статистика */}
      {globalStats && (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={5}
        >
          <HStack gap={2} mb={4}>
            <Icon as={LuGlobe} color="purple.500" />
            <Heading size="md">Общая статистика</Heading>
            <Text color="fg.muted" fontSize="sm" ml="auto">
              Всего тикетов: {globalStats.total}
            </Text>
          </HStack>

          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
            gap={4}
          >
            {totalStats.map((stat) => (
              <StatBox
                key={stat.label}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                bgColor={stat.bgColor}
                darkBgColor={stat.darkBgColor}
                fontSize="3xl"
              />
            ))}
          </Grid>
        </Box>
      )}

      {/* По линиям */}
      <Box>
        <HStack gap={2} mb={4}>
          <Icon as={LuInbox} color="blue.500" />
          <Heading size="md">По линиям поддержки</Heading>
        </HStack>

        {lineStats && lineStats.length > 0 ? (
          <VStack align="stretch" gap={4}>
            {lineStats.map((line) => (
              <LineStatsCard
                key={line.lineId}
                line={line}
                onStatClick={handleStatClick}
              />
            ))}
          </VStack>
        ) : (
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
            textAlign="center"
          >
            <Text color="fg.muted">Нет данных по линиям поддержки</Text>
          </Box>
        )}
      </Box>

      <TicketListModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        status={modal.status}
        lineId={modal.lineId}
      />
    </VStack>
  );
}
