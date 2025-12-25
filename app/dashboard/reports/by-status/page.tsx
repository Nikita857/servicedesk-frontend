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
import { LuArrowLeft, LuRefreshCw } from "react-icons/lu";
import Link from "next/link";
import { reportsApi, type TicketStatsByStatus } from "@/lib/api/reports";
import { toast } from "@/lib/utils";

// Маппинг статусов на цвета
const statusColors: Record<string, string> = {
  NEW: "blue",
  OPEN: "green",
  PENDING: "yellow",
  ESCALATED: "orange",
  RESOLVED: "teal",
  PENDING_CLOSURE: "purple",
  CLOSED: "gray",
  REOPENED: "red",
  REJECTED: "red",
  CANCELLED: "gray",
};

// Маппинг статусов на русские названия
const statusLabels: Record<string, string> = {
  NEW: "Новый",
  OPEN: "Открыт",
  PENDING: "Ожидание",
  ESCALATED: "Эскалация",
  RESOLVED: "Решён",
  PENDING_CLOSURE: "Ожидание закрытия",
  CLOSED: "Закрыт",
  REOPENED: "Переоткрыт",
  REJECTED: "Отклонён",
  CANCELLED: "Отменён",
};

export default function ByStatusReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TicketStatsByStatus[] | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getStatsByStatus();
      setData(result);
    } catch (error) {
      toast.error("Ошибка", "Не удалось загрузить статистику");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Подсчёт общего количества
  const totalCount = data?.reduce((sum, row) => sum + row.count, 0) || 0;

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm" mb={2}>
            <LuArrowLeft />
            Назад к отчётам
          </Button>
        </Link>
        <Heading size="xl" color="fg.default" mb={2}>
          По статусам
        </Heading>
        <Text color="fg.muted">Распределение тикетов по статусам</Text>
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
            <HStack gap={8}>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Статусов
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                  {data.length}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Всего тикетов
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="yellow.600">
                  {totalCount.toLocaleString("ru-RU")}
                </Text>
              </VStack>
            </HStack>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              loading={isLoading}
            >
              <LuRefreshCw />
              Обновить
            </Button>
          </HStack>

          {data.length === 0 ? (
            <Flex justify="center" py={10}>
              <Text color="fg.muted">Нет данных</Text>
            </Flex>
          ) : (
            <Table.Root size="md">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Статус</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Тикетов
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right" w="200px">
                    Процент
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row) => (
                  <Table.Row key={row.status}>
                    <Table.Cell>
                      <Badge
                        colorPalette={statusColors[row.status] || "gray"}
                        size="md"
                      >
                        {statusLabels[row.status] || row.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="medium">
                      {row.count.toLocaleString("ru-RU")}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end" gap={2}>
                        <Box
                          w={`${Math.min(row.percentage, 100)}%`}
                          maxW="100px"
                          h="10px"
                          bg={`${statusColors[row.status] || "gray"}.500`}
                          borderRadius="full"
                        />
                        <Text fontSize="sm" fontWeight="medium" w="55px">
                          {row.percentage.toFixed(1)}%
                        </Text>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      )}
    </Box>
  );
}
