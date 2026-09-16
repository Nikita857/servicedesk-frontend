"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Spinner,
  HStack,
  Button,
  VStack,
  Center,
  Text,
  NativeSelect,
  Badge,
  Field,
  Collapsible,
} from "@chakra-ui/react";
import { SDPagination } from "@/components/ui/SDPagination";
import { UserSearchSelect } from "@/components/ui/UserSearchSelect";
import Link from "next/link";
import { LuPlus, LuX, LuChevronDown, LuChevronUp, LuFilter } from "react-icons/lu";
import { TicketCard } from "./TicketCard";
import { TicketStatusHelpModal } from "./TicketStatusHelpModal";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { usePersistentPage, useTicketsQuery, useTicketsWebSocket } from "@/lib/hooks";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import {
  ticketStatusConfig,
  TicketStatusGroups,
  type TicketStatus,
  type TicketStatusGroup,
} from "@/types/ticket";

type UserFilterValue = { id: number; label: string } | null;

interface UserTicketsViewProps {
  status?: TicketStatus;
  hideHeader?: boolean;
  pageSize?: number;
  currentUserName?: string;
  initialFilter?: "my";
  /** Показывать блок фильтров (статус/исполнитель). По умолчанию скрыт — как у админов, которые видят фильтры только на странице заявок, а не на дашборде. */
  showFilters?: boolean;
}

/**
 * Точка входа: на странице /dashboard/my-tickets этот же компонент используют
 * специалисты для просмотра заявок, которые они сами создали (роль отличается
 * от роли USER, фильтры по статусу/исполнителю для этого случая не запрашивались) —
 * поэтому роутим на два независимых компонента с собственными наборами хуков,
 * а не смешиваем их логику в одном.
 */
export const UserTicketsView = (props: UserTicketsViewProps) => {
  const { hasAny } = useCurrentPermissions();
  const canSeeLineTickets = hasAny([PERM.TICKET_READ_LINE, PERM.TICKET_READ_ALL]);

  if (!canSeeLineTickets) {
    return <UserRoleTicketsView {...props} />;
  }

  return <AuthoredTicketsView {...props} />;
};

// =====================================================
// Роль USER: список своих заявок с фильтрами по статусу и исполнителю
// (стиль блока фильтров как у AdminTicketsView).
// =====================================================

const PAGE_SIZE = 5;
const STORAGE_KEY_STATUS = "sd_filter_user_status";
const STORAGE_KEY_ASSIGNEE = "sd_filter_user_assignee";
const STORAGE_KEY_FILTERS_OPEN = "sd_filter_user_open";

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

// statusFilter хранит либо "", либо сырой TicketStatus, либо "grp:ACTIVE" / "grp:INACTIVE".
function readStatusFilterStorage(): string {
  const raw = readStorage(STORAGE_KEY_STATUS);
  if (!raw) return "";
  if (raw === "grp:ACTIVE" || raw === "grp:INACTIVE") return raw;
  return raw in ticketStatusConfig ? raw : "";
}

function UserRoleTicketsView({
  status,
  hideHeader = false,
  pageSize,
  showFilters = false,
}: UserTicketsViewProps) {
  const { has } = useCurrentPermissions();
  const [page, setPage] = usePersistentPage("tickets");

  const [statusFilter, setStatusFilter] = useState<string>(() =>
    readStatusFilterStorage(),
  );
  const [assigneeFilter, setAssigneeFilter] = useState<UserFilterValue>(() =>
    readUserFilterStorage(STORAGE_KEY_ASSIGNEE),
  );
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    const stored = readStorage(STORAGE_KEY_FILTERS_OPEN);
    return stored === "" ? true : stored === "1";
  });

  const handleFiltersOpenChange = useCallback((open: boolean) => {
    setFiltersOpen(open);
    sessionStorage.setItem(STORAGE_KEY_FILTERS_OPEN, open ? "1" : "0");
  }, []);

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      sessionStorage.setItem(STORAGE_KEY_STATUS, value);
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

  const activeFilterCount = [statusFilter !== "", assigneeFilter !== null].filter(
    Boolean,
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = useCallback(() => {
    handleStatusChange("");
    handleAssigneeChange(null);
  }, [handleStatusChange, handleAssigneeChange]);

  useTicketsWebSocket();

  const isStatusGroup = statusFilter.startsWith("grp:");
  const statusesParam = isStatusGroup
    ? TicketStatusGroups[statusFilter.slice(4) as TicketStatusGroup]
    : undefined;
  const singleStatusParam =
    !isStatusGroup && statusFilter ? (statusFilter as TicketStatus) : undefined;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.tickets.list({
      filter: "user-filtered",
      page,
      status: singleStatusParam,
      statuses: statusesParam,
      assigneeId: assigneeFilter?.id,
    }),
    queryFn: () =>
      ticketApi.listFiltered(
        page,
        pageSize ?? PAGE_SIZE,
        singleStatusParam,
        undefined,
        undefined,
        assigneeFilter?.id,
        undefined,
        statusesParam,
      ),
    staleTime: 60 * 1000,
  });

  const content = data?.content ?? [];
  const tickets = status ? content.filter((t) => t.status === status) : content;

  return (
    <Box>
      {!hideHeader && (
        <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="fg.default" mb={0.5}>
              Мои обращения
              {isFetching && !isLoading && (
                <Spinner size="sm" ml={2} color="fg.subtle" />
              )}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Управление обращениями
            </Text>
          </Box>

          <HStack gap={3}>
            <TicketStatusHelpModal />
            {has(PERM.TICKET_CREATE) && (
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
      )}

      {showFilters && (
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
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
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
                      Исполнитель
                    </Field.Label>
                    <UserSearchSelect
                      value={assigneeFilter}
                      onChange={handleAssigneeChange}
                      placeholder="ФИО исполнителя..."
                    />
                  </Field.Root>
                </Grid>
              </Box>
            </Collapsible.Content>
          </Box>
        </Collapsible.Root>
      )}

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
          {!hideHeader && !hasActiveFilters && has(PERM.TICKET_CREATE) && (
            <Link href="/dashboard/tickets/new">
              <Button mt={4} size="sm" variant="outline">
                Создать первую заявку
              </Button>
            </Link>
          )}
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}

          {!status && data && data.page.totalPages > 1 && (
            <Center>
              <SDPagination page={data.page} action={setPage} size="sm" />
            </Center>
          )}
        </VStack>
      )}
    </Box>
  );
}

// =====================================================
// Специалисты на /dashboard/my-tickets: заявки, созданные ими лично
// (существующая логика через /tickets/my, без изменений).
// =====================================================

function AuthoredTicketsView({
  status,
  hideHeader = false,
  pageSize,
  initialFilter,
}: UserTicketsViewProps) {
  const { data, meta, actions } = useTicketsQuery({
    pageSize,
    initialFilter,
  });
  const { has } = useCurrentPermissions();

  useTicketsWebSocket();

  const content = data?.content ?? [];
  const tickets = status ? content.filter((t) => t.status === status) : content;

  return (
    <Box>
      {!hideHeader && (
        <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="fg.default" mb={1}>
              Мои обращения
              {meta.isFetching && !meta.isLoading && (
                <Spinner size="sm" ml={2} color="gray.400" />
              )}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Управление обращениями
            </Text>
          </Box>

          <HStack gap={3}>
            <TicketStatusHelpModal />
            {has(PERM.TICKET_CREATE) && (
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
      )}

      {meta.isLoading ? (
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
          {!hideHeader && has(PERM.TICKET_CREATE) && (
            <Link href="/dashboard/tickets/new">
              <Button mt={4} size="sm" variant="outline">
                Создать первую заявку
              </Button>
            </Link>
          )}
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
            />
          ))}

          {!status && data && data.page.totalPages > 1 && (
            <Center>
              <SDPagination
                page={data.page}
                action={actions.setPage}
                size="sm"
              />
            </Center>
          )}
        </VStack>
      )}
    </Box>
  );
}
