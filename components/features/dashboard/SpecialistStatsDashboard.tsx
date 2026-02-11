"use client";

import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Icon,
  VStack,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { LuSparkles, LuUserX } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api/stats";
import { queryKeys } from "@/lib/queryKeys";
import { TicketListModal } from "./TicketListModal";
import { LineStatsCard } from "./DashboardStatComponents";
import type { TicketStatus } from "@/types/ticket";

type ModalState = {
  isOpen: boolean;
  title: string;
  status: TicketStatus[] | null;
  lineId: number | null;
};

/**
 * Дашборд для специалистов
 * Показывает статистику по их линиям поддержки
 */
export function SpecialistStatsDashboard() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    status: null,
    lineId: null,
  });

  const { data: lineStatsResponse, isLoading } = useQuery({
    queryKey: queryKeys.stats.byAllLines(),
    queryFn: () => statsApi.getStatsByAllLines({ page: 0, size: 20 }),
    staleTime: 60 * 1000,
  });

  const lineStats = lineStatsResponse?.content;

  const handleStatClick = (title: string, status: TicketStatus[], lineId: number) => {
  setModal({ isOpen: true, title, status, lineId });
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
        status={modal.status}
        lineId={modal.lineId}
      />
    </Box>
  );
}
