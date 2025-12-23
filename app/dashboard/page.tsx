"use client";

import { useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  VStack,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import type { TicketListItem } from "@/types/ticket";
import { TicketCard } from "@/components/features/tickets";
import { useTicketsWebSocket, useDashboardQuery } from "@/lib/hooks";
import {
  UserStatsDashboard,
  SpecialistStatsDashboard,
  AdminStatsDashboard,
} from "@/components/features/dashboard";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN");
  const isSpecialist = user?.specialist || false;

  // Use TanStack Query for recent tickets (keeping for "unassigned tickets" section)
  const { recentTickets, isLoading, refetch } = useDashboardQuery();

  // Handle new ticket from WebSocket - refetch to update stats
  const handleNewTicket = useCallback(
    (_ticket: TicketListItem) => {
      refetch();
    },
    [refetch]
  );

  // WebSocket for real-time new tickets
  useTicketsWebSocket({
    onNewTicket: handleNewTicket,
    enabled: true,
  });

  // Render appropriate dashboard based on role
  const renderStatsDashboard = () => {
    if (isAdmin) {
      return <AdminStatsDashboard />;
    }
    if (isSpecialist) {
      return <SpecialistStatsDashboard />;
    }
    return <UserStatsDashboard />;
  };

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

      {/* Stats Dashboard based on role */}
      <Box mb={8}>{renderStatsDashboard()}</Box>

      {/* Секция невзятые тикеты (только для специалистов/админов) */}
      {(isSpecialist || isAdmin) && (
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color="fg.default">
              Невзятые тикеты
            </Heading>
            <Link href="/dashboard/tickets?filter=unprocessed">
              <Button variant="ghost" size="sm" color="fg.muted">
                Все невзятые
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
              <Text color="fg.muted">Нет невзятых тикетов</Text>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {recentTickets
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
}
