"use client";

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
import { useLineStatsQuery, type LineTicketStats } from "@/lib/hooks";

function LineStatsCard({ line }: { line: LineTicketStats }) {
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

      <Grid templateColumns="repeat(4, 1fr)" gap={3}>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
            {line.newTickets}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Новых
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="2xl" fontWeight="bold" color="orange.500">
            {line.open}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            В работе
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="2xl" fontWeight="bold" color="green.500">
            {line.resolved}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Решено
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
            {line.unassigned}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Без назначения
          </Text>
        </Box>
      </Grid>
    </Box>
  );
}

/**
 * Дашборд для специалистов
 * Показывает статистику по их линиям поддержки
 */
export function SpecialistStatsDashboard() {
  const { data: lineStats, isLoading } = useLineStatsQuery();

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
            <LineStatsCard key={line.lineId} line={line} />
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
    </Box>
  );
}
