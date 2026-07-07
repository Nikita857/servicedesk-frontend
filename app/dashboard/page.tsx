"use client";

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
import { TicketCard } from "@/components/features/tickets";
import {
  useTicketsWebSocket,
  useAssignmentsWebSocket,
  useDashboardQuery,
} from "@/lib/hooks";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import {
  UserStatsDashboard,
  SpecialistStatsDashboard,
  AdminStatsDashboard,
  SupervisorStatsDashboard,
} from "@/components/features/dashboard";
import { UserTicketsView} from "@/components/features/tickets/UserTicketsView";

export default function DashboardPage() {
  const { has } = useCurrentPermissions();

  // Use TanStack Query for recent tickets (keeping for "unassigned tickets" section)
  const { recentTickets, isLoading } = useDashboardQuery();

  // WebSocket: обновления списков тикетов через агрегированный /topic/tickets
  useTicketsWebSocket();

  // WebSocket for assignments (stats update)
  useAssignmentsWebSocket();

  const renderStatsDashboard = () => {
    if (has(PERM.USER_MANAGE) && has(PERM.REPORT_VIEW)) return <AdminStatsDashboard />;
    if (has(PERM.REPORT_VIEW))                          return <SupervisorStatsDashboard />;
    if (has(PERM.TICKET_READ_LINE))                     return <SpecialistStatsDashboard />;
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
        </Box>
      </Flex>

      {/* Секция невзятые тикеты (только для специалистов/админов) - СНИЗУ ВВЕРХ */}
      {(has(PERM.TICKET_READ_LINE) || has(PERM.TICKET_READ_ALL)) && (
        <Flex direction="column" flex={1} minH={0} mb={6}>
          <Flex justify="space-between" align="center" mb={4} flexShrink={0}>
            <Heading size="md" color="fg.default">
              Невзятые заявки
            </Heading>
            <Link href="/dashboard/tickets?filter=unprocessed">
              <Button variant="ghost" size="sm" color="fg.muted">
                Все заявки
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
                <Text color="fg.muted">Нет невзятых заявок</Text>
              </Box>
            ) : (
              <VStack gap={3} align="stretch" pb={4}>
                {recentTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </VStack>
            )}
          </Box>
        </Flex>
      )}
      {!has(PERM.TICKET_READ_LINE) && !has(PERM.TICKET_READ_ALL) && (
        <UserTicketsView/>
      )}

      {/* Дашборд статистики */}
      <Box
        flexShrink={0}
        mt="auto"
        maxH={has(PERM.REPORT_VIEW) ? "40vh" : undefined}
        overflowY={has(PERM.REPORT_VIEW) ? "auto" : undefined}
        pr={has(PERM.REPORT_VIEW) ? 2 : 0}
        css={
          has(PERM.REPORT_VIEW)
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
