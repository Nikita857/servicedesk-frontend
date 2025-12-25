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
  Badge,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuSearch,
  LuClock,
  LuUser,
  LuLayers,
} from "react-icons/lu";
import Link from "next/link";
import { reportsApi, type TicketHistory } from "@/lib/api/reports";
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

export default function TicketHistoryReportPage() {
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TicketHistory | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseInt(ticketId);
    if (!id || isNaN(id)) {
      toast.error("Ошибка", "Введите корректный ID тикета");
      return;
    }

    setIsLoading(true);
    try {
      const result = await reportsApi.getTicketHistory(id);
      setData(result);
    } catch (error) {
      toast.error("Ошибка", "Тикет не найден или недоступен");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}с`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          История тикета
        </Heading>
        <Text color="fg.muted">
          Полная история статусов и временная статистика по тикету
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
        <HStack gap={4}>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              ID тикета
            </Text>
            <Input
              type="number"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Например: 123"
              bg="bg.subtle"
              w="200px"
            />
          </VStack>
          <VStack align="start" gap={1}>
            <Text fontSize="sm" color="transparent">
              &nbsp;
            </Text>
            <Button type="submit" loading={isLoading} colorPalette="orange">
              <LuSearch />
              Найти
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
        <VStack gap={6} align="stretch">
          {/* Ticket Info Card */}
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="fg.default">
                Тикет #{data.ticketId}
              </Heading>
              <Badge
                colorPalette={statusColors[data.status] || "gray"}
                size="lg"
              >
                {statusLabels[data.status] || data.status}
              </Badge>
            </HStack>

            <Text fontSize="lg" fontWeight="medium" color="fg.default" mb={4}>
              {data.title}
            </Text>

            <HStack gap={8} flexWrap="wrap">
              <VStack align="start" gap={1}>
                <HStack gap={1} color="fg.muted">
                  <LuUser size={14} />
                  <Text fontSize="xs">Создатель</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {data.createdByFio || "—"}
                </Text>
              </VStack>

              <VStack align="start" gap={1}>
                <HStack gap={1} color="fg.muted">
                  <LuUser size={14} />
                  <Text fontSize="xs">Исполнитель</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {data.assignedToFio || "Не назначен"}
                </Text>
              </VStack>

              <VStack align="start" gap={1}>
                <HStack gap={1} color="fg.muted">
                  <LuLayers size={14} />
                  <Text fontSize="xs">Линия</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {data.supportLine || "—"}
                </Text>
              </VStack>

              <VStack align="start" gap={1}>
                <HStack gap={1} color="fg.muted">
                  <LuClock size={14} />
                  <Text fontSize="xs">Создан</Text>
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {formatDate(data.createdAt)}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Time Stats */}
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <Heading size="sm" color="fg.default" mb={4}>
              Временная статистика
            </Heading>
            <HStack gap={8} flexWrap="wrap">
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Время до первого ответа
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                  {formatTime(data.firstResponseTimeSeconds)}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Без назначения
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="orange.600">
                  {formatTime(data.totalUnassignedSeconds)}
                </Text>
              </VStack>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" color="fg.muted">
                  Активная работа
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="green.600">
                  {formatTime(data.totalActiveSeconds)}
                </Text>
              </VStack>
              {data.resolvedAt && (
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="fg.muted">
                    Решён
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDate(data.resolvedAt)}
                  </Text>
                </VStack>
              )}
              {data.closedAt && (
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="fg.muted">
                    Закрыт
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatDate(data.closedAt)}
                  </Text>
                </VStack>
              )}
            </HStack>
          </Box>

          {/* Status History Table */}
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            overflow="hidden"
          >
            <Box
              px={6}
              py={4}
              borderBottomWidth="1px"
              borderColor="border.default"
            >
              <Heading size="sm" color="fg.default">
                История статусов
              </Heading>
            </Box>

            {data.statusHistory.length === 0 ? (
              <Flex justify="center" py={10}>
                <Text color="fg.muted">Нет истории статусов</Text>
              </Flex>
            ) : (
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Статус</Table.ColumnHeader>
                    <Table.ColumnHeader>Начало</Table.ColumnHeader>
                    <Table.ColumnHeader>Завершение</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Длительность
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>Кто изменил</Table.ColumnHeader>
                    <Table.ColumnHeader>Комментарий</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.statusHistory.map((row) => (
                    <Table.Row key={row.id}>
                      <Table.Cell>
                        <Badge
                          colorPalette={statusColors[row.status] || "gray"}
                          size="sm"
                        >
                          {statusLabels[row.status] || row.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {formatDate(row.enteredAt)}
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {formatDate(row.exitedAt)}
                      </Table.Cell>
                      <Table.Cell textAlign="right" fontWeight="medium">
                        {row.durationFormatted ||
                          formatTime(row.durationSeconds)}
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {row.changedByFio || row.changedByUsername || "—"}
                      </Table.Cell>
                      <Table.Cell
                        fontSize="sm"
                        color="fg.muted"
                        maxW="200px"
                        truncate
                      >
                        {row.comment || "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </VStack>
      )}
    </Box>
  );
}
