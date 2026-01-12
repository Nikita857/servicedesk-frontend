"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  IconButton,
  Portal,
  Badge,
  createListCollection,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Link from "next/link";
import { adminApi, AdminTicketListItem } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import {
  ticketStatusConfig,
  ticketPriorityConfig,
  TicketStatus,
  TicketPriority,
} from "@/types/ticket";

type AdminFilter = "new" | "closed";

const filterCollection = createListCollection({
  items: [
    { label: "Невзятые", value: "new" },
    { label: "Закрытые", value: "closed" },
  ],
});

export function AdminTicketsView() {
  const [filter, setFilter] = useState<AdminFilter>("new");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-tickets", filter, page],
    queryFn: () =>
      filter === "new"
        ? adminApi.getNewTickets(page, pageSize)
        : adminApi.getClosedTickets(page, pageSize),
    staleTime: 30 * 1000,
  });

  const tickets = data?.content ?? [];
  const totalPages = data?.page?.totalPages ?? 0;

  const handleFilterChange = (newFilter: AdminFilter) => {
    setFilter(newFilter);
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Все тикеты
            {isFetching && !isLoading && (
              <Spinner size="sm" ml={2} color="gray.400" />
            )}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Просмотр всех тикетов системы
          </Text>
        </Box>

        <HStack gap={3}>
          <Select.Root
            collection={filterCollection}
            value={[filter]}
            onValueChange={(e) => handleFilterChange(e.value[0] as AdminFilter)}
            size="sm"
            width="180px"
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
        </HStack>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : tickets.length === 0 ? (
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
          <Text color="fg.muted">
            {filter === "new" ? "Нет невзятых тикетов" : "Нет закрытых тикетов"}
          </Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {tickets.map((ticket) => (
            <AdminTicketCard key={ticket.id} ticket={ticket} />
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

// Admin ticket card component
function AdminTicketCard({ ticket }: { ticket: AdminTicketListItem }) {
  const statusConf = ticketStatusConfig[ticket.status as TicketStatus] || {
    label: ticket.status,
    color: "gray",
  };
  const priorityConf = ticketPriorityConfig[
    ticket.priority as TicketPriority
  ] || {
    label: ticket.priority,
    color: "gray",
  };

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`}>
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={4}
        _hover={{ borderColor: "gray.300", shadow: "sm" }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
          <Box flex={1} minW="200px">
            <HStack gap={2} mb={2}>
              <Text fontWeight="medium" color="fg.default">
                #{ticket.id}
              </Text>
              <Badge colorPalette={statusConf.color}>{statusConf.label}</Badge>
              <Badge variant="subtle" colorPalette={priorityConf.color}>
                {priorityConf.label}
              </Badge>
            </HStack>

            <Text fontSize="md" fontWeight="medium" color="fg.default" mb={2}>
              {ticket.title}
            </Text>

            <HStack gap={4} fontSize="sm" color="fg.muted" flexWrap="wrap">
              <Text>Автор: {ticket.creatorFio || ticket.creatorUsername}</Text>
              {ticket.assigneeUsername && (
                <Text>
                  Исполнитель: {ticket.assigneeFio || ticket.assigneeUsername}
                </Text>
              )}
              {ticket.lineName && <Text>Линия: {ticket.lineName}</Text>}
              <Text>{formatDate(ticket.createdAt)}</Text>
            </HStack>
          </Box>
        </Flex>
      </Box>
    </Link>
  );
}
