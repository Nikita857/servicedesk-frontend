"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Spinner,
  Badge,
  Input,
  createListCollection,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { BackButton, DataSelect } from "@/components/ui";
import { SDPagination } from "@/components/ui/SDPagination";
import { reportsApi, type AllTicketsFilter } from "@/lib/api/reports";
import { handleApiError } from "@/lib/utils";
import {
  ticketStatusConfig,
  ticketPriorityConfig,
  type TicketStatus,
  type TicketPriority,
} from "@/types/ticket";
import { PaginatedResponse, TicketReportListResponse } from "@/types";

const statusCollection = createListCollection({
  items: [
    { value: "", label: "Все статусы" },
    ...(Object.keys(ticketStatusConfig) as TicketStatus[]).map((v) => ({
      value: v,
      label: ticketStatusConfig[v].label,
    })),
  ],
});

const priorityCollection = createListCollection({
  items: [
    { value: "", label: "Все приоритеты" },
    ...(Object.keys(ticketPriorityConfig) as TicketPriority[]).map((v) => ({
      value: v,
      label: ticketPriorityConfig[v].label,
    })),
  ],
});

export default function AllTicketsReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<
    TicketReportListResponse
  > | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Фильтры
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [creatorName, setCreatorName] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filter = useMemo<AllTicketsFilter>(
    () => ({
      status: (status[0] as TicketStatus) || undefined,
      priority: (priority[0] as TicketPriority) || undefined,
      creatorName: creatorName.trim() || undefined,
      executorName: executorName.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [status, priority, creatorName, executorName, from, to],
  );

  const hasActiveFilter =
    !!filter.status ||
    !!filter.priority ||
    !!filter.creatorName ||
    !!filter.executorName ||
    !!filter.from ||
    !!filter.to;

  const loadData = useCallback(async (pageNum: number, f: AllTicketsFilter) => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getAllTickets(pageNum, pageSize, f);
      setData(result);
      setPage(pageNum);
    } catch (error) {
      handleApiError(error, {
        context: "Получить заявки",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Любое изменение фильтра сбрасывает на первую страницу.
  // Debounce 400ms сглаживает ввод в текстовые поля.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(0, filter);
    }, 400);
    return () => clearTimeout(timer);
  }, [filter, loadData]);

  const resetFilters = () => {
    setStatus([]);
    setPriority([]);
    setCreatorName("");
    setExecutorName("");
    setFrom("");
    setTo("");
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <BackButton href="/dashboard/reports" label="Назад к отчётам" mb={2} />
        <Heading size="xl" color="fg.default" mb={2}>
          Все заявки
        </Heading>
        <Text color="fg.muted">Полный список заявок, включая удалённые</Text>
      </Box>

      {/* Filters */}
      <Box
        mb={4}
        p={4}
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Flex gap={3} wrap="wrap" align="end">
          <Box minW="180px" flex="1">
            <DataSelect
              label="Статус"
              size="sm"
              collection={statusCollection}
              value={status}
              onValueChange={(e) => setStatus(e.value)}
              placeholder="Все статусы"
            />
          </Box>
          <Box minW="180px" flex="1">
            <DataSelect
              label="Приоритет"
              size="sm"
              collection={priorityCollection}
              value={priority}
              onValueChange={(e) => setPriority(e.value)}
              placeholder="Все приоритеты"
            />
          </Box>
          <Box minW="180px" flex="1">
            <Text fontSize="sm" fontWeight="medium" color="fg.default" mb={1}>
              Создатель
            </Text>
            <Input
              size="sm"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="ФИО создателя"
            />
          </Box>
          <Box minW="180px" flex="1">
            <Text fontSize="sm" fontWeight="medium" color="fg.default" mb={1}>
              Исполнитель
            </Text>
            <Input
              size="sm"
              value={executorName}
              onChange={(e) => setExecutorName(e.target.value)}
              placeholder="ФИО исполнителя"
            />
          </Box>
          <Box minW="150px" flex="1">
            <Text fontSize="sm" fontWeight="medium" color="fg.default" mb={1}>
              Создан с
            </Text>
            <Input
              size="sm"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Box>
          <Box minW="150px" flex="1">
            <Text fontSize="sm" fontWeight="medium" color="fg.default" mb={1}>
              Создан по
            </Text>
            <Input
              size="sm"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </Box>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetFilters}
            disabled={!hasActiveFilter}
          >
            <LuX />
            Сбросить
          </Button>
        </Flex>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      )}

      {/* Results */}
      {data && !isLoading && (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          overflow="hidden"
        >
          {/* Summary */}
          <HStack
            px={6}
            py={4}
            bg="bg.subtle"
            borderBottomWidth="1px"
            borderColor="border.default"
            justify="space-between"
          >
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="fg.muted">
                Всего заявок
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                {(data.page.totalElements ?? 0).toLocaleString("ru-RU")}
              </Text>
            </VStack>
            <Text fontSize="sm" color="fg.muted">
              Страница {page + 1} из {data.page.totalPages ?? 1}
            </Text>
          </HStack>

          {data.content.length === 0 ? (
            <Flex justify="center" py={10}>
              <Text color="fg.muted">Нет данных</Text>
            </Flex>
          ) : (
            <>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>ID</Table.ColumnHeader>
                      <Table.ColumnHeader>Название</Table.ColumnHeader>
                      <Table.ColumnHeader>Статус</Table.ColumnHeader>
                      <Table.ColumnHeader>Приоритет</Table.ColumnHeader>
                      <Table.ColumnHeader>Создатель</Table.ColumnHeader>
                      <Table.ColumnHeader>Исполнитель</Table.ColumnHeader>
                      <Table.ColumnHeader>Линия</Table.ColumnHeader>
                      <Table.ColumnHeader>Создан</Table.ColumnHeader>
                      <Table.ColumnHeader>Удалён</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.content.map((row) => (
                      <Table.Row
                        key={row.id}
                        bg={row.deletedAt ? "red.subtle" : undefined}
                      >
                        <Table.Cell fontWeight="medium">#{row.id}</Table.Cell>
                        <Table.Cell maxW="200px" truncate>
                          {row.title}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={
                              ticketStatusConfig[
                                row.status as keyof typeof ticketStatusConfig
                              ]?.color || "gray"
                            }
                            variant="subtle"
                            size="sm"
                          >
                            {ticketStatusConfig[
                              row.status as keyof typeof ticketStatusConfig
                            ]?.label || row.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={
                              ticketPriorityConfig[
                                row.priority as keyof typeof ticketPriorityConfig
                              ]?.color || "gray"
                            }
                            size="sm"
                            variant="subtle"
                          >
                            {ticketPriorityConfig[
                              row.priority as keyof typeof ticketPriorityConfig
                            ]?.label || row.priority}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontSize="sm">
                          {row.createdByFio || "—"}
                        </Table.Cell>
                        <Table.Cell fontSize="sm">
                          {row.assignedToFio || "—"}
                        </Table.Cell>
                        <Table.Cell fontSize="sm">
                          {row.supportLineName || "—"}
                        </Table.Cell>
                        <Table.Cell fontSize="sm">
                          {formatDate(row.createdAt)}
                        </Table.Cell>
                        <Table.Cell fontSize="sm">
                          {row.deletedAt ? (
                            <Text color="red.600">
                              {formatDate(row.deletedAt)}
                            </Text>
                          ) : (
                            "—"
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>

              {/* Pagination */}
              {data.page.totalPages > 1 && (
                <Box
                  px={6}
                  py={4}
                  borderTopWidth="1px"
                  borderColor="border.default"
                >
                  <SDPagination
                    page={data.page}
                    action={(p) => loadData(p, filter)}
                    size="sm"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
