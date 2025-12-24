"use client";

import { useMemo, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  HStack,
  VStack,
  IconButton,
  Portal,
  createListCollection,
  Badge,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuPlus, LuChevronLeft, LuChevronRight, LuBell } from "react-icons/lu";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { TicketCard } from "@/components/features/tickets";
import {
  useTicketsQuery,
  useTicketsCountsQuery,
  useAssignmentsActions,
  useTicketsWebSocket,
  FilterType,
} from "@/lib/hooks";

export default function TicketsPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const userRoles = user?.roles || [];
  const canCreateTicket =
    userRoles.includes("USER") || userRoles.includes("ADMIN");

  // Read filter from URL query param
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as FilterType | null;

  // ==================== React Query Hooks ====================
  const {
    tickets,
    pendingAssignments,
    isLoading,
    isFetching,
    page,
    totalPages,
    filter,
    setPage,
    setFilter,
    refetch,
    addTicket,
  } = useTicketsQuery({ initialFilter: urlFilter || undefined });

  // Sync filter when URL changes
  useEffect(() => {
    if (urlFilter && urlFilter !== filter) {
      setFilter(urlFilter);
    }
  }, [urlFilter, filter, setFilter]);

  const {
    pendingCount,
    assignedToMeCount,
    closedCount,
    unprocessedCount,
    refetch: refreshCounts,
  } = useTicketsCountsQuery();

  const router = useRouter();

  // Check if user should be redirected after accepting assignment
  // Redirect for specialists (not USER and not ADMIN)
  const shouldRedirectOnAccept = isSpecialist && !userRoles.includes("ADMIN");

  const { handleAccept, handleReject } = useAssignmentsActions({
    onSuccess: async () => {
      refetch();
      refreshCounts();
    },
    onAcceptSuccess: shouldRedirectOnAccept
      ? (ticketId) => router.push(`/dashboard/tickets/${ticketId}`)
      : undefined,
  });

  // WebSocket for new tickets (enabled for all users)
  useTicketsWebSocket({
    onNewTicket: (ticket) => {
      addTicket(ticket);
      refreshCounts();
    },
    enabled: true,
  });

  // ==================== Фильтр тикетов ====================
  const filterCollection = useMemo(() => {
    if (isSpecialist) {
      return createListCollection({
        items: [
          {
            label: `Необработанные (${unprocessedCount})`,
            value: "unprocessed",
          },
          {
            label: `Назначенные мне (${assignedToMeCount})`,
            value: "assigned",
          },
          { label: `Ожидающие (${pendingCount})`, value: "pending" },
          {
            label: `Закрытые (${closedCount})`,
            value: "closed",
          },
        ],
      });
    }
    return createListCollection({
      items: [{ label: "Мои тикеты", value: "my" }],
    });
  }, [
    isSpecialist,
    unprocessedCount,
    assignedToMeCount,
    pendingCount,
    closedCount,
  ]);

  // ==================== UI ====================
  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            {isSpecialist ? "Тикеты" : "Мои заявки"}
            {isFetching && !isLoading && (
              <Spinner size="sm" ml={2} color="gray.400" />
            )}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление обращениями
          </Text>
        </Box>

        <HStack gap={3}>
          {isSpecialist && (
            <Select.Root
              collection={filterCollection}
              value={[filter]}
              onValueChange={(e) => setFilter(e.value[0] as FilterType)}
              size="sm"
              width="200px"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Фильтр" />
              </Select.Trigger>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {filterCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}

          {canCreateTicket && (
            <Link href="/dashboard/tickets/new">
              <Button
                size="sm"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
              >
                <LuPlus />
                Новый тикет
              </Button>
            </Link>
          )}
        </HStack>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : filter === "pending" ? (
        <PendingAssignmentsList
          assignments={pendingAssignments}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ) : tickets.length === 0 ? (
        <EmptyTicketsList canCreateTicket={canCreateTicket} />
      ) : (
        <VStack gap={4} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </VStack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex mt={6} justify="center" align="center" gap={4}>
          <IconButton
            aria-label="Previous page"
            variant="ghost"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <LuChevronLeft />
          </IconButton>

          <Text color="fg.muted" fontSize="sm">
            Страница {page + 1} из {totalPages}
          </Text>

          <IconButton
            aria-label="Next page"
            variant="ghost"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            <LuChevronRight />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
}

// ==================== Sub-components ====================

interface PendingAssignmentsListProps {
  assignments: Array<{
    id: number;
    ticketId: number;
    ticketTitle?: string;
    fromFio?: string | null;
    fromUsername?: string | null;
    fromLineName?: string | null;
    note?: string | null;
  }>;
  onAccept: (id: number) => Promise<boolean>;
  onReject: (id: number) => Promise<boolean>;
}

function PendingAssignmentsList({
  assignments,
  onAccept,
  onReject,
}: PendingAssignmentsListProps) {
  if (assignments.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        h="200px"
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
      >
        <LuBell size={48} color="gray" />
        <Text mt={4} color="fg.muted">
          Нет ожидающих назначений
        </Text>
      </Flex>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {assignments.map((assignment) => (
        <Box
          key={assignment.id}
          bg="yellow.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="yellow.200"
          p={4}
          _dark={{ bg: "yellow.900/20", borderColor: "yellow.700" }}
        >
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
            <Box>
              <Link href={`/dashboard/tickets/${assignment.ticketId}`}>
                <Text
                  fontWeight="medium"
                  color="fg.default"
                  _hover={{ textDecoration: "underline" }}
                >
                  #{assignment.ticketId}: {assignment.ticketTitle}
                </Text>
              </Link>
              <Text fontSize="sm" color="fg.muted" mt={1}>
                От:{" "}
                {assignment.fromFio ||
                  assignment.fromUsername ||
                  assignment.fromLineName ||
                  "—"}
              </Text>
              {assignment.note && (
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  Комментарий: {assignment.note}
                </Text>
              )}
              <Badge mt={2} colorPalette="yellow">
                Ожидает принятия
              </Badge>
            </Box>
            <HStack gap={2}>
              <Button
                size="sm"
                colorPalette="green"
                onClick={() => onAccept(assignment.id)}
              >
                Принять
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => onReject(assignment.id)}
              >
                Отклонить
              </Button>
            </HStack>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
}

interface EmptyTicketsListProps {
  canCreateTicket: boolean;
}

function EmptyTicketsList({ canCreateTicket }: EmptyTicketsListProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="200px"
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
    >
      <Text color="fg.muted">Тикеты не найдены</Text>
      {canCreateTicket && (
        <Link href="/dashboard/tickets/new">
          <Button mt={4} size="sm" variant="outline">
            Создать первый тикет
          </Button>
        </Link>
      )}
    </Flex>
  );
}
