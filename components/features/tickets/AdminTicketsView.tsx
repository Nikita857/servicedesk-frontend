"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Button,
  Center,
  NativeSelect,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { LuPlus, LuUserCheck } from "react-icons/lu";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { TicketCard } from "./TicketCard";
import { TicketCompactCard } from "./TicketCompactCard";
import { TicketStatusHelpModal } from "./TicketStatusHelpModal";
import { SDPagination } from "@/components/ui/SDPagination";
import { usePersistentPage, useAuth } from "@/lib/hooks";
import { ticketStatusConfig, type TicketStatus } from "@/types/ticket";

const PAGE_SIZE = 7;
const ASSIGNED_PAGE_SIZE = 5;
const STORAGE_KEY_STATUS = "sd_filter_admin_status";
const STORAGE_KEY_LINE = "sd_filter_admin_line";

function readStorage(key: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key) ?? "";
}

export function AdminTicketsView() {
  const { user } = useAuth();
  const [page, setPage] = usePersistentPage("admin-tickets");

  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">(
    () => readStorage(STORAGE_KEY_STATUS) as TicketStatus | ""
  );
  const [lineFilter, setLineFilter] = useState<number | "">(
    () => {
      const v = readStorage(STORAGE_KEY_LINE);
      return v ? Number(v) : "";
    }
  );

  const handleStatusChange = useCallback((value: TicketStatus | "") => {
    setStatusFilter(value);
    sessionStorage.setItem(STORAGE_KEY_STATUS, value);
    setPage(0);
  }, [setPage]);

  const handleLineChange = useCallback((value: number | "") => {
    setLineFilter(value);
    sessionStorage.setItem(STORAGE_KEY_LINE, value === "" ? "" : String(value));
    setPage(0);
  }, [setPage]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.tickets.list({
      filter: "all",
      page,
      status: statusFilter || undefined,
      lineId: lineFilter || undefined,
    }),
    queryFn: () =>
      ticketApi.listFiltered(
        page,
        PAGE_SIZE,
        statusFilter || undefined,
        lineFilter || undefined
      ),
    staleTime: 30 * 1000,
  });

  const { data: lines } = useQuery({
    queryKey: ["supportLines", "all"],
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Tickets assigned to this admin
  const [assignedPage, setAssignedPage] = useState(0);
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: queryKeys.tickets.list({ filter: "assigned", page: assignedPage }),
    queryFn: () => ticketApi.listAssigned(assignedPage, ASSIGNED_PAGE_SIZE),
    staleTime: 30 * 1000,
  });

  const tickets = data?.content ?? [];
  const assignedTickets = assignedData?.content ?? [];

  return (
    <Box>
      {/* Assigned to me block */}
      <Box
        mb={6}
        bg="bg.surface"
        border="1px solid"
        borderColor="border.default"
        borderRadius="xl"
        overflow="hidden"
      >
        <Box
          bg="orange.50"
          borderBottomWidth="1px"
          borderBottomColor="orange.200"
          px={4}
          py={3}
          _dark={{
            bg: "orange.900/20",
            borderBottomColor: "orange.800",
          }}
        >
          <HStack gap={2}>
            <Icon as={LuUserCheck} boxSize={4} color="orange.600" />
            <Heading size="sm" color="fg.default">
              Назначено на меня
            </Heading>
            <Badge colorPalette="orange" variant="subtle" size="sm">
              {assignedData?.page.totalElements ?? 0}
            </Badge>
          </HStack>
        </Box>

        <Box px={3} py={2}>
          {assignedLoading ? (
            <Flex justify="center" align="center" h="80px">
              <Spinner size="md" />
            </Flex>
          ) : assignedTickets.length === 0 ? (
            <Flex justify="center" align="center" h="80px">
              <Text color="fg.muted" fontSize="sm">
                Назначенных заявок нет
              </Text>
            </Flex>
          ) : (
            <VStack gap={1.5} align="stretch">
              {assignedTickets.map((ticket) => (
                <TicketCompactCard
                  key={ticket.id}
                  ticket={ticket}
                  currentUserName={user?.username}
                />
              ))}
            </VStack>
          )}
        </Box>

        {assignedData && assignedData.page.totalPages > 1 && (
          <SDPagination
            page={assignedData.page}
            action={setAssignedPage}
            size="xs"
          />
        )}
      </Box>

      {/* Header */}
      <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Все заявки
            {isFetching && !isLoading && (
              <Spinner size="sm" ml={2} color="gray.400" />
            )}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Просмотр всех заявок системы
          </Text>
        </Box>

        <Flex gap={2} direction={{ base: "column", sm: "row" }} align={{ base: "stretch", sm: "center" }}>
          <HStack gap={2}>
            <NativeSelect.Root size="sm" flex={1}>
              <NativeSelect.Field
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus | "")}
              >
                <option value="">Все статусы</option>
                {(Object.keys(ticketStatusConfig) as TicketStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {ticketStatusConfig[s].label}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <NativeSelect.Root size="sm" flex={1}>
              <NativeSelect.Field
                value={lineFilter}
                onChange={(e) =>
                  handleLineChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Все линии</option>
                {lines?.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>

          <HStack gap={2} justify={{ base: "flex-start", sm: "flex-end" }}>
            <TicketStatusHelpModal />
            <Link href="/dashboard/tickets/new">
              <Button
                size="sm"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
              >
                <LuPlus />
                Новая заявка
              </Button>
            </Link>
          </HStack>
        </Flex>
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
          <Text color="fg.muted">Заявки не найдены</Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}

          {data && data.page.totalPages > 1 && (
            <Center>
              <SDPagination
                page={data.page}
                action={setPage}
                size="sm"
              />
            </Center>
          )}
        </VStack>
      )}
    </Box>
  );
}
