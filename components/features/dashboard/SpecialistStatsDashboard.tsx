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
import { LuUsers, LuSparkles, LuUserX } from "react-icons/lu";
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
  onClick?: () => void;
}

function StatBox({ label, value, color, onClick }: StatBoxProps) {
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
      <Text fontSize="2xl" fontWeight="bold" color={color}>
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
          <StatBox
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
 * Дашборд для специалистов
 * Показывает статистику по их линиям поддержки
 */
export function SpecialistStatsDashboard() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
  });
  const [currentLine, setCurrentLine] = useState<LineTicketStats | null>(null);

  // Fetch stats WITH tickets
  const { data: lineStats, isLoading } = useQuery({
    queryKey: [...queryKeys.stats.byAllLines(), { includeTickets: true }],
    queryFn: () =>
      statsApi.getStatsByAllLines({ includeTickets: true, pageSize: 10 }),
    staleTime: 60 * 1000,
  });

  const handleStatClick = (
    line: LineTicketStats,
    title: string,
    statusKey: string,
  ) => {
    if (!line.ticketsByStatus?.[statusKey]) return;
    setCurrentLine(line);
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

  return (
    <Box>
      <HStack gap={2} mb={4}>
        <Icon as={LuSparkles} color="purple.500" />
        <Heading size="md">Мои линии поддержки</Heading>
      </HStack>

      {lineStats && lineStats.length > 0 ? (
        <VStack align="stretch" gap={4}>
          {lineStats.map((line) => (
            <LineStatsCard
              key={line.lineId}
              line={line}
              onStatClick={(title, statusKey) =>
                handleStatClick(line, title, statusKey)
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
          <Icon as={LuUserX} boxSize={10} color="fg.muted" mb={3} />
          <Text color="fg.muted">
            Вы не привязаны ни к одной линии поддержки
          </Text>
        </Box>
      )}

      <TicketListModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        initialData={modal.data}
      />
    </Box>
  );
}
