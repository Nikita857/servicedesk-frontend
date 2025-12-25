"use client";

import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import { LuArrowLeft, LuSearch } from "react-icons/lu";
import Link from "next/link";
import { reportsApi, type TimeReportBySpecialist } from "@/lib/api/reports";
import { toast } from "@/lib/utils";

export default function TimeBySpecialistReportPage() {
  // Дефолтные даты: последние 30 дней
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [fromDate, setFromDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TimeReportBySpecialist[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromDate || !toDate) {
      toast.error("Ошибка", "Укажите обе даты");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("Ошибка", "Дата начала не может быть позже даты окончания");
      return;
    }

    setIsLoading(true);
    try {
      const result = await reportsApi.getTimeBySpecialist(fromDate, toDate);
      setData(result);
    } catch (error) {
      toast.error("Ошибка", "Не удалось загрузить отчёт");
    } finally {
      setIsLoading(false);
    }
  };

  // Вычислить общее время
  const totalSeconds =
    data?.reduce((sum, row) => sum + row.totalSeconds, 0) || 0;
  const totalTickets =
    data?.reduce((sum, row) => sum + row.ticketCount, 0) || 0;

  const formatTime = (seconds: number): string => {
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
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm" mb={2}>
            <LuArrowLeft />
            Назад к отчётам
          </Button>
        </Link>
        <Heading size="xl" color="fg.default" mb={2}>
          Время по специалистам
        </Heading>
        <Text color="fg.muted">
          Затраченное время на тикеты по каждому специалисту за выбранный период
        </Text>
      </Box>

      {/* Form */}
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={6}
        mb={6}
      >
        <HStack gap={4} flexWrap="wrap">
          <VStack align="start" gap={1}>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              Дата начала
            </Text>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              bg="bg.subtle"
              w="180px"
            />
          </VStack>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              Дата окончания
            </Text>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              bg="bg.subtle"
              w="180px"
            />
          </VStack>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" color="transparent">
              &nbsp;
            </Text>
            <Button type="submit" loading={isLoading} colorPalette="blue">
              <LuSearch />
              Сформировать
            </Button>
          </VStack>
        </HStack>
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
          {data.length === 0 ? (
            <Flex justify="center" py={10}>
              <Text color="fg.muted">Нет данных за выбранный период</Text>
            </Flex>
          ) : (
            <>
              {/* Summary */}
              <HStack
                px={6}
                py={4}
                bg="bg.subtle"
                borderBottomWidth="1px"
                borderColor="border.default"
                gap={8}
              >
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="fg.muted">
                    Всего специалистов
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                    {data.length}
                  </Text>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="fg.muted">
                    Всего тикетов
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                    {totalTickets}
                  </Text>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="fg.muted">
                    Общее время
                  </Text>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {formatTime(totalSeconds)}
                  </Text>
                </VStack>
              </HStack>

              {/* Table */}
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Специалист</Table.ColumnHeader>
                    <Table.ColumnHeader>Username</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Тикетов
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Время
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
                        {row.ticketCount}
                      </Table.Cell>
                      <Table.Cell
                        textAlign="right"
                        fontWeight="medium"
                        color="blue.600"
                      >
                        {row.formattedTime || formatTime(row.totalSeconds)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
