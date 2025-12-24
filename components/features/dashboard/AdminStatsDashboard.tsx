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
import { LuUsers, LuGlobe, LuInbox } from "react-icons/lu";
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

      <Grid
        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }}
        gap={3}
      >
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="xl" fontWeight="bold" color="blue.500">
            {line.newTickets}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Новых
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="xl" fontWeight="bold" color="orange.500">
            {line.open}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            В работе
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="xl" fontWeight="bold" color="green.500">
            {line.resolved}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Решено
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="xl" fontWeight="bold" color="gray.500">
            {line.closed}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Закрыто
          </Text>
        </Box>
        <Box textAlign="center" p={3} bg="bg.subtle" borderRadius="lg">
          <Text fontSize="xl" fontWeight="bold" color="yellow.500">
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
 * Дашборд для администраторов
 * Показывает статистику по ВСЕМ линиям поддержки
 */
export function AdminStatsDashboard() {
  const { data: lineStats, isLoading } = useLineStatsQuery();

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
    { total: 0, newTickets: 0, open: 0, resolved: 0, closed: 0, unassigned: 0 }
  );

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
            templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }}
            gap={4}
          >
            <Box
              textAlign="center"
              p={4}
              bg="blue.50"
              borderRadius="lg"
              _dark={{ bg: "blue.900/20" }}
            >
              <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                {totals.newTickets}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Новых
              </Text>
            </Box>
            <Box
              textAlign="center"
              p={4}
              bg="orange.50"
              borderRadius="lg"
              _dark={{ bg: "orange.900/20" }}
            >
              <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                {totals.open}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                В работе
              </Text>
            </Box>
            <Box
              textAlign="center"
              p={4}
              bg="green.50"
              borderRadius="lg"
              _dark={{ bg: "green.900/20" }}
            >
              <Text fontSize="3xl" fontWeight="bold" color="green.500">
                {totals.resolved}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Решено
              </Text>
            </Box>
            <Box
              textAlign="center"
              p={4}
              bg="gray.50"
              borderRadius="lg"
              _dark={{ bg: "gray.900/20" }}
            >
              <Text fontSize="3xl" fontWeight="bold" color="gray.500">
                {totals.closed}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Закрыто
              </Text>
            </Box>
            <Box
              textAlign="center"
              p={4}
              bg="yellow.50"
              borderRadius="lg"
              _dark={{ bg: "yellow.900/20" }}
            >
              <Text fontSize="3xl" fontWeight="bold" color="yellow.500">
                {totals.unassigned}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Без назначения
              </Text>
            </Box>
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
            <Text color="fg.muted">Нет данных по линиям поддержки</Text>
          </Box>
        )}
      </Box>
    </VStack>
  );
}
