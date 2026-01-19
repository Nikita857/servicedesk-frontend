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
import { LuUsers, LuGlobe, LuInbox } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import {
  statsApi,
  type LineTicketStats,
  type TicketPageResponse,
} from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { TicketListModal } from "./TicketListModal";

type ModalState = {
  isOpen: boolean;
  title: string;
  data?: TicketPageResponse;
};

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  darkBgColor: string;
  onClick?: () => void;
}

function StatBox({
  label,
  value,
  color,
  bgColor,
  darkBgColor,
  onClick,
}: StatBoxProps) {
  return (
    <Box
      textAlign="center"
      p={4}
      bg={bgColor}
      borderRadius="lg"
      _dark={{ bg: darkBgColor }}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={onClick ? { transform: "scale(1.02)", opacity: 0.9 } : {}}
      transition="all 0.15s"
    >
      <Text fontSize="3xl" fontWeight="bold" color={color}>
        {value}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
    </Box>
  );
}

interface LineStatBoxProps {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

function LineStatBox({ label, value, color, onClick }: LineStatBoxProps) {
  return (
    <Box
      textAlign="center"
      p={3}
      bg="bg.subtle"
      borderRadius="lg"
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={onClick ? { bg: "bg.muted", transform: "scale(1.02)" } : {}}
      transition="all 0.15s"
    >
      <Text fontSize="xl" fontWeight="bold" color={color}>
        {value}
      </Text>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
    </Box>
  );
}

function LineStatsCard({
  line,
  onStatClick,
}: {
  line: LineTicketStats;
  onStatClick: (title: string, statusKey: string) => void;
}) {
  const stats = [
    {
      label: "Новых",
      value: line.newTickets,
      color: "blue.500",
      statusKey: "NEW",
    },
    {
      label: "В работе",
      value: line.open,
      color: "orange.500",
      statusKey: "OPEN",
    },
    {
      label: "Закрыто",
      value: line.closed,
      color: "gray.500",
      statusKey: "CLOSED",
    },
    {
      label: "Без назначения",
      value: line.unassigned,
      color: "yellow.500",
      statusKey: "NEW",
    },
  ];

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={2}>
          <Icon as={LuUsers} color="blue.500" />
          <Heading size="md">{line.lineName}</Heading>
        </HStack>
        <Text color="fg.muted" fontSize="sm">
          Всего: {line.total}
        </Text>
      </Flex>

      <Grid
        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={3}
      >
        {stats.map((stat) => (
          <LineStatBox
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            onClick={
              line.ticketsByStatus?.[stat.statusKey]
                ? () =>
                    onStatClick(
                      `${line.lineName} — ${stat.label}`,
                      stat.statusKey,
                    )
                : undefined
            }
          />
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Дашборд для администраторов
 * Показывает статистику по ВСЕМ линиям поддержки
 */
export function AdminStatsDashboard() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
  });

  // Fetch stats WITH tickets
  const { data: lineStats, isLoading } = useQuery({
    queryKey: [...queryKeys.stats.byAllLines(), { includeTickets: true }],
    queryFn: () =>
      statsApi.getStatsByAllLines({ includeTickets: true, pageSize: 10 }),
    staleTime: 60 * 1000,
  });

  const handleLineStatClick = (
    line: LineTicketStats,
    title: string,
    statusKey: string,
  ) => {
    if (!line.ticketsByStatus?.[statusKey]) return;
    setModal({
      isOpen: true,
      title,
      data: line.ticketsByStatus[statusKey],
    });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner />
      </Flex>
    );
  }

  // Подсчитаем общую статистику
  const totals = lineStats?.reduce(
    (acc, line) => ({
      total: acc.total + line.total,
      newTickets: acc.newTickets + line.newTickets,
      open: acc.open + line.open,
      resolved: acc.resolved + line.resolved,
      closed: acc.closed + line.closed,
      unassigned: acc.unassigned + line.unassigned,
    }),
    { total: 0, newTickets: 0, open: 0, resolved: 0, closed: 0, unassigned: 0 },
  );

  const totalStats = [
    {
      label: "Новых",
      value: totals?.newTickets || 0,
      color: "blue.500",
      bgColor: "blue.50",
      darkBgColor: "blue.900/20",
    },
    {
      label: "В работе",
      value: totals?.open || 0,
      color: "orange.500",
      bgColor: "orange.50",
      darkBgColor: "orange.900/20",
    },
    {
      label: "Закрыто",
      value: totals?.closed || 0,
      color: "gray.500",
      bgColor: "gray.50",
      darkBgColor: "gray.900/20",
    },
    {
      label: "Без назначения",
      value: totals?.unassigned || 0,
      color: "yellow.500",
      bgColor: "yellow.50",
      darkBgColor: "yellow.900/20",
    },
  ];

  return (
    <VStack align="stretch" gap={6}>
      {/* Общая статистика */}
      {totals && (
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
              Всего тикетов: {totals.total}
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
                onStatClick={(title, statusKey) =>
                  handleLineStatClick(line, title, statusKey)
                }
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
        initialData={modal.data}
      />
    </VStack>
  );
}
