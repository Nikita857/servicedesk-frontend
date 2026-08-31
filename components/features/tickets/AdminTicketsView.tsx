"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Button,
  Center,
  NativeSelect,
  Badge,
  Input,
  Field,
  Collapsible,
} from "@chakra-ui/react";
import { LuPlus, LuX, LuChevronDown, LuChevronUp, LuFilter } from "react-icons/lu";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { TicketCard } from "./TicketCard";
import { TicketCompactCard } from "./TicketCompactCard";
import { TicketStatusHelpModal } from "./TicketStatusHelpModal";
import { SDPagination } from "@/components/ui/SDPagination";
import { UserSearchSelect } from "@/components/ui/UserSearchSelect";
import { usePersistentPage, useTicketListSubscription } from "@/lib/hooks";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import {
  ticketStatusConfig,
  TicketStatusGroups,
  type TicketStatus,
  type TicketStatusGroup,
} from "@/types/ticket";
import { useWebSocket } from "@/lib/providers";
import { useQueryClient } from "@tanstack/react-query";

type UserFilterValue = { id: number; label: string } | null;

interface AdminTicketsViewProps {
  enabled?: boolean;
}

const PAGE_SIZE = 6;
const ASSIGNED_PAGE_SIZE = 6;
const STORAGE_KEY_STATUS = "sd_filter_admin_status";
const STORAGE_KEY_LINE = "sd_filter_admin_line";
const STORAGE_KEY_TICKET_ID = "sd_filter_admin_ticket_id";
const STORAGE_KEY_TAB = "sd_admin_tab";
const STORAGE_KEY_ASSIGNED_STATUS = "sd_filter_assigned_status";
const STORAGE_KEY_ASSIGNEE = "sd_filter_admin_assignee";
const STORAGE_KEY_AUTHOR = "sd_filter_admin_author";
const STORAGE_KEY_FILTERS_OPEN = "sd_filter_admin_open";

function readStorage(key: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key) ?? "";
}

function readUserFilterStorage(key: string): UserFilterValue {
  const raw = readStorage(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === "number" && typeof parsed?.label === "string") {
      return parsed;
    }
  } catch {
    // ignore malformed value, treat as no selection
  }
  return null;
}

// statusFilter хранит либо "" , либо сырой TicketStatus, либо "grp:ACTIVE" / "grp:INACTIVE".
// Валидируем то, что могло остаться в хранилище от старых версий.
function readStatusFilterStorage(): string {
  const raw = readStorage(STORAGE_KEY_STATUS);
  if (!raw) return "";
  if (raw === "grp:ACTIVE" || raw === "grp:INACTIVE") return raw;
  return raw in ticketStatusConfig ? raw : "";
}

export function AdminTicketsView(options: AdminTicketsViewProps = {}) {
  const { has } = useCurrentPermissions();
  const [page, setPage] = usePersistentPage("admin-tickets");
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const prevConnectedRef = useRef<boolean | null>(null);
  const { enabled = true } = options;

  const [tab, setTab] = useState<"all" | "assigned">(
    () => (readStorage(STORAGE_KEY_TAB) as "all" | "assigned") || "all",
  );

  // "" | TicketStatus | "grp:ACTIVE" | "grp:INACTIVE"
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    readStatusFilterStorage(),
  );

  const [lineFilter, setLineFilter] = useState<number | "">(() => {
    const v = readStorage(STORAGE_KEY_LINE);
    return v ? Number(v) : "";
  });

  const [ticketIdFilter, setTicketIdFilter] = useState<string>(() =>
    readStorage(STORAGE_KEY_TICKET_ID),
  );
  const [ticketIdInput, setTicketIdInput] = useState<string>(ticketIdFilter);

  const [assigneeFilter, setAssigneeFilter] = useState<UserFilterValue>(() =>
    readUserFilterStorage(STORAGE_KEY_ASSIGNEE),
  );
  const [authorFilter, setAuthorFilter] = useState<UserFilterValue>(() =>
    readUserFilterStorage(STORAGE_KEY_AUTHOR),
  );

  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    const stored = readStorage(STORAGE_KEY_FILTERS_OPEN);
    return stored === "" ? true : stored === "1";
  });

  const handleFiltersOpenChange = useCallback((open: boolean) => {
    setFiltersOpen(open);
    sessionStorage.setItem(STORAGE_KEY_FILTERS_OPEN, open ? "1" : "0");
  }, []);

  const [assignedStatusFilter, setAssignedStatusFilter] = useState<
    TicketStatus | ""
  >(() => readStorage(STORAGE_KEY_ASSIGNED_STATUS) as TicketStatus | "");

  const [assignedPage, setAssignedPage] = useState(0);

  const handleTabChange = useCallback(
    (value: "all" | "assigned") => {
      setTab(value);
      sessionStorage.setItem(STORAGE_KEY_TAB, value);
      setPage(0);
    },
    [setPage],
  );

  const handleAssignedStatusChange = useCallback((value: TicketStatus | "") => {
    setAssignedStatusFilter(value);
    sessionStorage.setItem(STORAGE_KEY_ASSIGNED_STATUS, value);
    setAssignedPage(0);
  }, []);

  const handleStatusChange = useCallback(
    (value: string) => {
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

  const commitTicketIdFilter = useCallback(
    (value: string) => {
      const normalized = value.trim();
      setTicketIdFilter(normalized);
      sessionStorage.setItem(STORAGE_KEY_TICKET_ID, normalized);
      setPage(0);
    },
    [setPage],
  );

  const handleAssigneeChange = useCallback(
    (value: UserFilterValue) => {
      setAssigneeFilter(value);
      if (value) {
        sessionStorage.setItem(STORAGE_KEY_ASSIGNEE, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_ASSIGNEE);
      }
      setPage(0);
    },
    [setPage],
  );

  const handleAuthorChange = useCallback(
    (value: UserFilterValue) => {
      setAuthorFilter(value);
      if (value) {
        sessionStorage.setItem(STORAGE_KEY_AUTHOR, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_AUTHOR);
      }
      setPage(0);
    },
    [setPage],
  );

  const activeFilterCount = [
    statusFilter !== "",
    lineFilter !== "",
    ticketIdFilter !== "",
    assigneeFilter !== null,
    authorFilter !== null,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = useCallback(() => {
    handleStatusChange("");
    handleLineChange("");
    commitTicketIdFilter("");
    setTicketIdInput("");
    handleAssigneeChange(null);
    handleAuthorChange(null);
  }, [
    handleStatusChange,
    handleLineChange,
    commitTicketIdFilter,
    handleAssigneeChange,
    handleAuthorChange,
  ]);

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

  // Разбор значения фильтра статуса: группа ("grp:ACTIVE") → список статусов,
  // иначе — одиночный статус.
  const isStatusGroup = statusFilter.startsWith("grp:");
  const statusesParam = isStatusGroup
    ? TicketStatusGroups[statusFilter.slice(4) as TicketStatusGroup]
    : undefined;
  const singleStatusParam =
    !isStatusGroup && statusFilter ? (statusFilter as TicketStatus) : undefined;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.tickets.list({
      filter: "all",
      page,
      status: singleStatusParam,
      statuses: statusesParam,
      lineId: lineFilter || undefined,
      ticketId: ticketIdFilter ? Number(ticketIdFilter) : undefined,
      assigneeId: assigneeFilter?.id,
      authorId: authorFilter?.id,
    }),
    queryFn: () =>
      ticketApi.listFiltered(
        page,
        PAGE_SIZE,
        singleStatusParam,
        lineFilter || undefined,
        ticketIdFilter ? Number(ticketIdFilter) : undefined,
        assigneeFilter?.id,
        authorFilter?.id,
        statusesParam,
      ),
    staleTime: 300 * 1000,
    refetchInterval: 300 * 1000,
  });

  const { data: lines } = useQuery({
    queryKey: ["supportLines", "all"],
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: queryKeys.tickets.list({
      filter: "assigned",
      page: assignedPage,
      status: assignedStatusFilter || undefined,
    }),
    queryFn: () =>
      ticketApi.listAssigned(
        assignedPage,
        ASSIGNED_PAGE_SIZE,
        assignedStatusFilter || undefined,
      ),
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
          {has(PERM.TICKET_CREATE) && (
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
          )}
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
        <Collapsible.Root
          open={filtersOpen}
          onOpenChange={(e) => handleFiltersOpenChange(e.open)}
        >
          <Box
            mb={4}
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            overflow="hidden"
          >
            <Flex align="center">
              <Collapsible.Trigger asChild>
                <Button
                  variant="ghost"
                  flex={1}
                  justifyContent="space-between"
                  px={4}
                  py={3}
                  h="auto"
                  borderRadius="none"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  <HStack gap={2}>
                    <LuFilter size={14} />
                    <Text>Фильтры</Text>
                    {activeFilterCount > 0 && (
                      <Badge
                        colorPalette="accent"
                        variant="solid"
                        size="sm"
                        borderRadius="full"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </HStack>
                  {filtersOpen ? (
                    <LuChevronUp size={14} />
                  ) : (
                    <LuChevronDown size={14} />
                  )}
                </Button>
              </Collapsible.Trigger>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="fg.muted"
                  mr={2}
                  onClick={resetFilters}
                >
                  <LuX />
                  Сбросить
                </Button>
              )}
            </Flex>

            <Collapsible.Content>
              <Box px={4} pb={4}>
                <Grid
                  templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                  gap={3}
                >
                  <Field.Root>
                    <Field.Label fontSize="xs" color="fg.muted">
                      Статус
                    </Field.Label>
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        <option value="">Все статусы</option>
                        <optgroup label="Группы">
                          <option value="grp:ACTIVE">Активные</option>
                          <option value="grp:INACTIVE">Неактивные</option>
                        </optgroup>
                        <optgroup label="Статусы">
                          {(
                            Object.keys(ticketStatusConfig) as TicketStatus[]
                          ).map((s) => (
                            <option key={s} value={s}>
                              {ticketStatusConfig[s].label}
                            </option>
                          ))}
                        </optgroup>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" color="fg.muted">
                      Линия поддержки
                    </Field.Label>
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
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" color="fg.muted">
                      Исполнитель
                    </Field.Label>
                    <UserSearchSelect
                      value={assigneeFilter}
                      onChange={handleAssigneeChange}
                      placeholder="ФИО исполнителя..."
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" color="fg.muted">
                      Автор
                    </Field.Label>
                    <UserSearchSelect
                      value={authorFilter}
                      onChange={handleAuthorChange}
                      placeholder="ФИО автора..."
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="xs" color="fg.muted">
                      № заявки
                    </Field.Label>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Например, 1024"
                      value={ticketIdInput}
                      onChange={(e) => setTicketIdInput(e.target.value)}
                      onBlur={() => commitTicketIdFilter(ticketIdInput)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          commitTicketIdFilter(ticketIdInput);
                        }
                      }}
                    />
                  </Field.Root>
                </Grid>
              </Box>
            </Collapsible.Content>
          </Box>
        </Collapsible.Root>
      )}

      {/* Filters — only on "assigned" tab (status only) */}
      {tab === "assigned" && (
        <Flex gap={2} mb={4} wrap="wrap">
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={assignedStatusFilter}
              onChange={(e) =>
                handleAssignedStatusChange(e.target.value as TicketStatus | "")
              }
            >
              <option value="">Активные</option>
              {(Object.keys(ticketStatusConfig) as TicketStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ticketStatusConfig[s].label}
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
            <TicketCompactCard key={ticket.id} ticket={ticket} />
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
