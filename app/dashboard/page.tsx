'use client';

import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { LuTicket, LuClock, LuCheck, LuClockAlert } from 'react-icons/lu';
import type { IconType } from 'react-icons';

interface StatCardProps {
  label: string;
  value: string | number;
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
        <Box
          p={3}
          borderRadius="lg"
          bg={`${color}/10`}
        >
          <Icon as={icon} boxSize={6} color={color} />
        </Box>
      </Flex>
    </Box>
  );
}

export default function DashboardPage() {
  // TODO: Fetch actual stats from API
  const stats = [
    { label: 'Всего тикетов', value: 124, icon: LuTicket, color: 'accent.500' },
    { label: 'В работе', value: 18, icon: LuClock, color: 'warning.500' },
    { label: 'Решено сегодня', value: 7, icon: LuCheck, color: 'success.500' },
    { label: 'Просрочено', value: 3, icon: LuClockAlert, color: 'error.500' },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Flex mb={6} justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Дашборд
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Обзор системы поддержки
          </Text>
        </Box>
      </Flex>

      {/* Stats Grid */}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={5}
        mb={8}
      >
        {stats.map((stat) => (
          <GridItem key={stat.label}>
            <StatCard {...stat} />
          </GridItem>
        ))}
      </Grid>

      {/* Recent Tickets Section */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={5}
      >
        <Heading size="md" color="fg.default" mb={4}>
          Последние тикеты
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Здесь будет список последних тикетов...
        </Text>
      </Box>
    </Box>
  );
}
