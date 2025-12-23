"use client";

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
import {
  LuTicket,
  LuClock,
  LuCircleCheck,
  LuArchive,
  LuTimer,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { useMyStatsQuery } from "@/lib/hooks";

interface StatCardProps {
  label: string;
  value: number;
  icon: IconType;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
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

/**
 * Простой дашборд для обычных пользователей
 * Показывает только их собственную статистику тикетов
 */
export function UserStatsDashboard() {
  const { data: stats, isLoading } = useMyStatsQuery();

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

  return (
    <Box>
      <Heading size="md" mb={4}>
        Мои обращения
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(5, 1fr)",
        }}
        gap={4}
      >
        <GridItem>
          <StatCard
            label="Всего"
            value={stats.total}
            icon={LuTicket}
            color="blue.500"
          />
        </GridItem>
        <GridItem>
          <StatCard
            label="В работе"
            value={stats.open}
            icon={LuClock}
            color="orange.500"
          />
        </GridItem>
        <GridItem>
          <StatCard
            label="Решено"
            value={stats.resolved}
            icon={LuCircleCheck}
            color="green.500"
          />
        </GridItem>
        <GridItem>
          <StatCard
            label="Закрыто"
            value={stats.closed}
            icon={LuArchive}
            color="gray.500"
          />
        </GridItem>
        <GridItem>
          <StatCard
            label="Ожидание"
            value={stats.waiting}
            icon={LuTimer}
            color="yellow.500"
          />
        </GridItem>
      </Grid>
    </Box>
  );
}
