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
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { TicketCard } from "./TicketCard";
import { TicketStatusHelpModal } from "./TicketStatusHelpModal";
import { SDPagination } from "@/components/ui/SDPagination";
import { usePersistentPage } from "@/lib/hooks";
import { ticketStatusConfig, type TicketStatus } from "@/types/ticket";

const PAGE_SIZE = 7;
const STORAGE_KEY_STATUS = "sd_filter_admin_status";
const STORAGE_KEY_LINE = "sd_filter_admin_line";

function readStorage(key: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key) ?? "";
}

export function AdminTicketsView() {
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

  const tickets = data?.content ?? [];

  return (
    <Box>
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

        <HStack gap={3}>
          {/* Filters */}
          <NativeSelect.Root size="sm" w="160px">
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

          <NativeSelect.Root size="sm" w="160px">
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
