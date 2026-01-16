"use client";

import { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { BackButton } from "@/components/ui";
import { reportsApi, type PagedTicketReport } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";
import { ticketStatusConfig, ticketPriorityConfig } from "@/types/ticket";

export default function AllTicketsReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PagedTicketReport | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const loadData = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getAllTickets(pageNum, pageSize);
      setData(result);
      setPage(pageNum);
    } catch (error) {
      handleApiError(error, {
        context: "Получить тикеты",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
  }, []);

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
          Все тикеты
        </Heading>
        <Text color="fg.muted">Полный список тикетов, включая удалённые</Text>
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
                Всего тикетов
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                {(data.totalElements ?? 0).toLocaleString("ru-RU")}
              </Text>
            </VStack>
            <Text fontSize="sm" color="fg.muted">
              Страница {page + 1} из {data.totalPages ?? 1}
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
              <HStack
                px={6}
                py={4}
                borderTopWidth="1px"
                borderColor="border.default"
                justify="center"
                gap={2}
              >
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.first}
                  onClick={() => loadData(page - 1)}
                >
                  <LuChevronLeft />
                  Назад
                </Button>
                <HStack gap={1}>
                  {Array.from(
                    { length: Math.min(data.totalPages, 5) },
                    (_, i) => {
                      let pageNum: number;
                      if (data.totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page >= data.totalPages - 2) {
                        pageNum = data.totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={pageNum === page ? "solid" : "ghost"}
                          onClick={() => loadData(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    }
                  )}
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.last}
                  onClick={() => loadData(page + 1)}
                >
                  Вперёд
                  <LuChevronRight />
                </Button>
              </HStack>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
