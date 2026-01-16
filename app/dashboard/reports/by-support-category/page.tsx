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
import { LuRefreshCw } from "react-icons/lu";
import Link from "next/link";
import { BackButton } from "@/components/ui";
import { reportsApi, type TicketStatsByCategory } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";

// Маппинг типов категорий
const categoryTypeColors: Record<string, string> = {
  GENERAL: "blue",
  HIDDEN: "gray",
  ESCALATION: "orange",
  SYSTEM: "purple",
};

const categoryTypeLabels: Record<string, string> = {
  GENERAL: "Общая",
  HIDDEN: "Скрытая",
  ESCALATION: "Эскалация",
  SYSTEM: "Системная",
};

export default function BySupportCategoryReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TicketStatsByCategory[] | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getStatsBySupportCategory();
      setData(result);
    } catch (error) {
      handleApiError(error, {
        context: "Получить статистику по категориям поддержки",
      });
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
        <BackButton href="/dashboard/reports" label="Назад к отчётам" mb={2} />
        <Heading size="xl" color="fg.default" mb={2}>
          По категориям поддержки
        </Heading>
        <Text color="fg.muted">
          Статистика тикетов по категориям, назначенным специалистами поддержки
        </Text>
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
                  Всего категорий
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                  {data.length}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Всего тикетов
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="pink.600">
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
                  <Table.ColumnHeader>Категория</Table.ColumnHeader>
                  <Table.ColumnHeader>Тип</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Тикетов
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right" w="150px">
                    Процент
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row, index) => (
                  <Table.Row key={row.categoryId || `null-${index}`}>
                    <Table.Cell fontWeight="medium">
                      {row.categoryName || "Без категории"}
                    </Table.Cell>
                    <Table.Cell>
                      {row.categoryType ? (
                        <Badge
                          colorPalette={
                            categoryTypeColors[row.categoryType] || "gray"
                          }
                          size="sm"
                        >
                          {categoryTypeLabels[row.categoryType] ||
                            row.categoryType}
                        </Badge>
                      ) : (
                        <Text fontSize="sm" color="fg.muted">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      {row.count.toLocaleString("ru-RU")}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end" gap={2}>
                        <Box
                          w={`${Math.min(row.percentage, 100)}%`}
                          maxW="80px"
                          h="8px"
                          bg="pink.500"
                          borderRadius="full"
                        />
                        <Text fontSize="sm" color="fg.muted" w="50px">
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
