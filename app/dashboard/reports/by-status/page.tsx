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
import { BackButton } from "@/components/ui";
import { reportsApi, type TicketStatsByStatus } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";
import { ticketStatusConfig } from "@/types/ticket";

export default function ByStatusReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TicketStatsByStatus[] | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getStatsByStatus();
      setData(result);
    } catch (error) {
      handleApiError(error, {
        context: "Получить статистику по статусам",
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
                        colorPalette={
                          ticketStatusConfig[
                            row.status as keyof typeof ticketStatusConfig
                          ]?.color || "gray"
                        }
                        variant="subtle"
                      >
                        {ticketStatusConfig[
                          row.status as keyof typeof ticketStatusConfig
                        ]?.label || row.status}
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
                          bg={
                            ticketStatusConfig[
                              row.status as keyof typeof ticketStatusConfig
                            ]?.color || "gray.200"
                          }
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
