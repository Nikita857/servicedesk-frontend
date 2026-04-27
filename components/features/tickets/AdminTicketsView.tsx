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
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { TicketCard } from "./TicketCard";
import { TicketCompactCard } from "./TicketCompactCard";
import { TicketStatusHelpModal } from "./TicketStatusHelpModal";
import { SDPagination } from "@/components/ui/SDPagination";
import {
  usePersistentPage,
  useAuth,
  useTicketListSubscription,
} from "@/lib/hooks";
import { ticketStatusConfig, type TicketStatus } from "@/types/ticket";
import { useWebSocket } from "@/lib/providers";
import { useQueryClient } from "@tanstack/react-query";

interface AdminTicketsViewProps {
  enabled?: boolean;
}

const PAGE_SIZE = 6;
const ASSIGNED_PAGE_SIZE = 6;
const STORAGE_KEY_STATUS = "sd_filter_admin_status";
const STORAGE_KEY_LINE = "sd_filter_admin_line";
const STORAGE_KEY_TAB = "sd_admin_tab";

function readStorage(key: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key) ?? "";
}

export function AdminTicketsView(options: AdminTicketsViewProps = {}) {
  const { user } = useAuth();
  const [page, setPage] = usePersistentPage("admin-tickets");
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const prevConnectedRef = useRef<boolean | null>(null);
  const { enabled = true } = options;

  const [tab, setTab] = useState<"all" | "assigned">(
    () => (readStorage(STORAGE_KEY_TAB) as "all" | "assigned") || "all",
  );

  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">(
    () => readStorage(STORAGE_KEY_STATUS) as TicketStatus | "",
  );
  const [lineFilter, setLineFilter] = useState<number | "">(() => {
    const v = readStorage(STORAGE_KEY_LINE);
    return v ? Number(v) : "";
  });

  const handleTabChange = useCallback(
    (value: "all" | "assigned") => {
      setTab(value);
      sessionStorage.setItem(STORAGE_KEY_TAB, value);
      setPage(0);
    },
    [setPage],
  );

  const handleStatusChange = useCallback(
    (value: TicketStatus | "") => {
      setStatusFilter(value);
      sessionStorage.setItem(STORAGE_KEY_STATUS, value);
      setPage(0);
    },
    [setPage],
  );

  const handleLineChange = useCallback(
    (value: number | "") => {
      setLineFilter(value);
      sessionStorage.setItem(
        STORAGE_KEY_LINE,
        value === "" ? "" : String(value),
      );
      setPage(0);
    },
    [setPage],
  );

  useTicketListSubscription({
    queryKey: queryKeys.tickets.lists(),
    enabled,
  });

  useEffect(() => {
    if (isConnected && prevConnectedRef.current === false) {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, queryClient]);

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
        lineFilter || undefined,
      ),
    staleTime: 300 * 1000,
    refetchInterval: 300 * 1000,
  });

  const { data: lines } = useQuery({
    queryKey: ["supportLines", "all"],
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const [assignedPage, setAssignedPage] = useState(0);
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: queryKeys.tickets.list({
      filter: "assigned",
      page: assignedPage,
    }),
    queryFn: () => ticketApi.listAssigned(assignedPage, ASSIGNED_PAGE_SIZE),
    staleTime: 300 * 1000,
    refetchInterval: 300 * 1000,
  });

  const tickets = data?.content ?? [];
  const assignedTickets = assignedData?.content ?? [];
  const assignedTotal = assignedData?.page.totalElements ?? 0;

  return (
    <Box>
      {/* Header */}
      <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={0.5}>
            Заявки
            {isFetching && !isLoading && (
              <Spinner size="sm" ml={2} color="fg.subtle" />
            )}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление обращениями
          </Text>
        </Box>

        <HStack gap={2}>
          <TicketStatusHelpModal />
          <Link href="/dashboard/tickets/new">
            <Button
              size="sm"
              bg="accent.800"
              color="white"
              _hover={{ bg: "accent.700" }}
            >
              <LuPlus />
              Новая заявка
            </Button>
          </Link>
        </HStack>
      </Flex>

      {/* Tabs */}
      <Box bg="bg.subtle" borderRadius="xl" p={1} mb={4} display="flex" gap={1}>
        {(["all", "assigned"] as const).map((key) => (
          <Box
            key={key}
            flex={1}
            as="button"
            borderRadius="lg"
            py={2}
            px={4}
            fontSize="sm"
            fontWeight="medium"
            cursor="pointer"
            border="none"
            transition="all 0.15s"
            bg={tab === key ? "bg.surface" : "transparent"}
            color={tab === key ? "fg.default" : "fg.muted"}
            boxShadow={tab === key ? "sm" : "none"}
            onClick={() => handleTabChange(key)}
          >
            {key === "all" ? (
              "Все заявки"
            ) : (
              <HStack gap={2} justify="center">
                <Text>Назначено на меня</Text>
                {assignedTotal > 0 && (
                  <Badge
                    colorPalette="accent"
                    variant="solid"
                    size="sm"
                    borderRadius="full"
                  >
                    {assignedTotal}
                  </Badge>
                )}
              </HStack>
            )}
          </Box>
        ))}
      </Box>

      {/* Filters — only on "all" tab */}
      {tab === "all" && (
        <Flex gap={2} mb={4} wrap="wrap">
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={statusFilter}
              onChange={(e) =>
                handleStatusChange(e.target.value as TicketStatus | "")
              }
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

          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={lineFilter}
              onChange={(e) =>
                handleLineChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
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
        </Flex>
      )}

      {/* Content */}
      {tab === "all" ? (
        isLoading ? (
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
                <SDPagination page={data.page} action={setPage} size="sm" />
              </Center>
            )}
          </VStack>
        )
      ) : /* Assigned tab */
      assignedLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : assignedTickets.length === 0 ? (
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
          <Text color="fg.muted">Назначенных заявок нет</Text>
        </Flex>
      ) : (
        <VStack gap={2} align="stretch">
          {assignedTickets.map((ticket) => (
            <TicketCompactCard
              key={ticket.id}
              ticket={ticket}
              currentUserName={user?.username}
            />
          ))}
          {assignedData && assignedData.page.totalPages > 1 && (
            <SDPagination
              page={assignedData.page}
              action={setAssignedPage}
              size="sm"
            />
          )}
        </VStack>
      )}
    </Box>
  );
}
