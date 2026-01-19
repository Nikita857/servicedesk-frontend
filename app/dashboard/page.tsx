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
import {
  useTicketsWebSocket,
  useAssignmentsWebSocket,
  useDashboardQuery,
} from "@/lib/hooks";
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
    [refetch],
  );

  // WebSocket for real-time new tickets
  useTicketsWebSocket({
    onNewTicket: handleNewTicket,
    enabled: true,
  });

  // WebSocket for assignments (stats update)
  useAssignmentsWebSocket();

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
    <Flex direction="column" h="full">
      {/* Page Header */}
      <Flex mb={4} justify="space-between" align="center" flexShrink={0}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Дашборд
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Обзор системы поддержки
          </Text>
        </Box>
      </Flex>

      {/* Секция невзятые тикеты (только для специалистов/админов) - СНИЗУ ВВЕРХ */}
      {(isSpecialist || isAdmin) && (
        <Flex direction="column" flex={1} minH={0} mb={6}>
          <Flex justify="space-between" align="center" mb={4} flexShrink={0}>
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

          <Box
            flex={1}
            overflowY="auto"
            pr={2}
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "gray.300",
                borderRadius: "10px",
              },
            }}
          >
            {isLoading ? (
              <Flex justify="center" align="center" py={10}>
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
              <VStack gap={3} align="stretch" pb={4}>
                {recentTickets
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </VStack>
            )}
          </Box>
        </Flex>
      )}

      {/* Дашборд статистики */}
      <Box
        flexShrink={0}
        mt="auto"
        maxH={isAdmin ? "40vh" : undefined}
        overflowY={isAdmin ? "auto" : undefined}
        pr={isAdmin ? 2 : 0}
        css={
          isAdmin
            ? {
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "gray.300",
                  borderRadius: "10px",
                },
              }
            : undefined
        }
      >
        {renderStatsDashboard()}
      </Box>
    </Flex>
  );
}
