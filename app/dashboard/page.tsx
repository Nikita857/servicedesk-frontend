'use client';

import { useState, useEffect } from 'react';
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
  Button,
} from '@chakra-ui/react';
import { LuTicket, LuClock, LuCircleCheck, LuCircleAlert, LuArrowRight } from 'react-icons/lu';
import Link from 'next/link';
import type { IconType } from 'react-icons';
import { ticketApi } from '@/lib/api/tickets';
import type { TicketListItem } from '@/types/ticket';
import { TicketCard } from '@/components/features/tickets';

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
          bg="bg.subtle"
        >
          <Icon as={icon} boxSize={6} color={color} />
        </Box>
      </Flex>
    </Box>
  );
}

export default function DashboardPage() {
  const [recentTickets, setRecentTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    overdue: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent tickets
        const ticketsResponse = await ticketApi.list(0, 5);
        setRecentTickets(ticketsResponse.content);
        setStats({
          total: ticketsResponse.totalElements,
          open: ticketsResponse.content.filter(t => ['NEW', 'OPEN', 'PENDING'].includes(t.status)).length,
          resolved: ticketsResponse.content.filter(t => t.status === 'RESOLVED').length,
          overdue: ticketsResponse.content.filter(t => t.slaDeadline && new Date(t.slaDeadline) < new Date()).length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Всего тикетов', value: stats.total, icon: LuTicket, color: 'gray.600' },
    { label: 'В работе', value: stats.open, icon: LuClock, color: 'orange.500' },
    { label: 'Решено', value: stats.resolved, icon: LuCircleCheck, color: 'green.500' },
    { label: 'Просрочено', value: stats.overdue, icon: LuCircleAlert, color: 'red.500' },
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
        {statCards.map((stat) => (
          <GridItem key={stat.label}>
            <StatCard {...stat} />
          </GridItem>
        ))}
      </Grid>

      {/* Recent Tickets Section */}
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="fg.default">
            Последние тикеты
          </Heading>
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm" color="fg.muted">
              Все тикеты
              <LuArrowRight />
            </Button>
          </Link>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner />
          </Flex>
        ) : recentTickets.length === 0 ? (
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={8}
            textAlign="center"
          >
            <Text color="fg.muted">Нет тикетов</Text>
          </Box>
        ) : (
          <VStack gap={3} align="stretch">
            {recentTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
