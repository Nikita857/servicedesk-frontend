"use client";

import { useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Icon,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { LuTicket, LuClock, LuArchive, LuTimer } from "react-icons/lu";
import type { IconType } from "react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  statsApi,
  type UserTicketStats,
  type TicketPageResponse,
} from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { TicketListModal } from "./TicketListModal";

interface StatCardProps {
  label: string;
  value: number;
  icon: IconType;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={
        onClick ? { borderColor: color, transform: "translateY(-2px)" } : {}
      }
      transition="all 0.2s"
    >
      <Flex align="flex-start" justify="space-between">
        <VStack align="flex-start" gap={1}>
          <Text color="fg.muted" fontSize="sm">
            {label}
          </Text>
          <Heading size="2xl" color="fg.default">
            {value}
          </Heading>
        </VStack>
        <Box p={3} borderRadius="lg" bg="bg.subtle">
          <Icon as={icon} boxSize={6} color={color} />
        </Box>
      </Flex>
    </Box>
  );
}

type ModalState = {
  isOpen: boolean;
  title: string;
  statusKey: string;
  data?: TicketPageResponse;
};

/**
 * Простой дашборд для обычных пользователей
 * Показывает только их собственную статистику тикетов
 */
export function UserStatsDashboard() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    statusKey: "",
  });

  // Fetch stats WITH tickets included
  const { data: stats, isLoading } = useQuery({
    queryKey: [...queryKeys.stats.my(), { includeTickets: true }],
    queryFn: () => statsApi.getMyStats({ includeTickets: true, pageSize: 10 }),
    staleTime: 60 * 1000,
  });

  const handleCardClick = (title: string, statusKey: string) => {
    if (!stats?.ticketsByStatus?.[statusKey]) return;
    setModal({
      isOpen: true,
      title,
      statusKey,
      data: stats.ticketsByStatus[statusKey],
    });
  };

  const handlePageChange = async (
    page: number,
  ): Promise<TicketPageResponse | undefined> => {
    // For now, the API doesn't support pagination per status separately,
    // so we just return the current data. This is a placeholder for future enhancement.
    return modal.data;
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner />
      </Flex>
    );
  }

  if (!stats) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="fg.muted">Не удалось загрузить статистику</Text>
      </Box>
    );
  }

  // Map UI labels to status keys
  const cards = [
    {
      label: "Всего",
      value: stats.total,
      icon: LuTicket,
      color: "blue.500",
      statusKey: "",
    },
    {
      label: "В работе",
      value: stats.open,
      icon: LuClock,
      color: "orange.500",
      statusKey: "OPEN",
    },
    {
      label: "Закрыто",
      value: stats.closed,
      icon: LuArchive,
      color: "gray.500",
      statusKey: "CLOSED",
    },
    {
      label: "Ожидание",
      value: stats.waiting,
      icon: LuTimer,
      color: "yellow.500",
      statusKey: "PENDING_CLOSURE",
    },
  ];

  return (
    <Box>
      <Heading size="md" mb={4}>
        Мои обращения
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={4}
      >
        {cards.map((card) => (
          <GridItem key={card.label}>
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={card.color}
              onClick={
                card.statusKey && stats.ticketsByStatus?.[card.statusKey]
                  ? () => handleCardClick(card.label, card.statusKey)
                  : undefined
              }
            />
          </GridItem>
        ))}
      </Grid>

      <TicketListModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        initialData={modal.data}
        onPageChange={handlePageChange}
      />
    </Box>
  );
}
