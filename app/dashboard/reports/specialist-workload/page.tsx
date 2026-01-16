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
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import { LuRefreshCw } from "react-icons/lu";
import { BackButton } from "@/components/ui";
import { reportsApi, type SpecialistWorkload } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";

export default function SpecialistWorkloadReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SpecialistWorkload[] | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getSpecialistWorkload();
      setData(result);
    } catch (error) {
      handleApiError(error, { context: "Получить отчёт по специалистам" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Подсчёт сумм
  const totalActive =
    data?.reduce((sum, row) => sum + row.activeTickets, 0) || 0;
  const totalResolved =
    data?.reduce((sum, row) => sum + row.resolvedToday, 0) || 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}с`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <BackButton href="/dashboard/reports" label="Назад к отчётам" mb={2} />
        <Heading size="xl" color="fg.default" mb={2}>
          Загрузка специалистов
        </Heading>
        <Text color="fg.muted">
          Текущая загрузка специалистов: активные тикеты и статистика за сегодня
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
                  Специалистов
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                  {data.length}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Активных тикетов
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="orange.600">
                  {totalActive}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Решено сегодня
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="green.600">
                  {totalResolved}
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
                  <Table.ColumnHeader>Специалист</Table.ColumnHeader>
                  <Table.ColumnHeader>Username</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Активных
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Решено сегодня
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Время сегодня
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Среднее время
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row) => (
                  <Table.Row key={row.specialistId}>
                    <Table.Cell fontWeight="medium">
                      {row.fio || "—"}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{row.username}</Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text
                        fontWeight="medium"
                        color={
                          row.activeTickets > 5
                            ? "red.600"
                            : row.activeTickets > 0
                            ? "orange.600"
                            : "fg.muted"
                        }
                      >
                        {row.activeTickets}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Text fontWeight="medium" color="green.600">
                        {row.resolvedToday}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      {row.formattedTimeToday || formatTime(row.totalTimeToday)}
                    </Table.Cell>
                    <Table.Cell textAlign="right" color="fg.muted">
                      {formatTime(row.avgResolutionTime)}
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
