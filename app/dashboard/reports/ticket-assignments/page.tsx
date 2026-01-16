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
import { LuSearch, LuArrowRight } from "react-icons/lu";
import { BackButton } from "@/components/ui";
import { reportsApi, type ReassignmentHistory } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";
import { assignmentStatusConfig, assignmentModeConfig } from "@/types/ticket";

export default function TicketAssignmentsReportPage() {
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReassignmentHistory[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseInt(ticketId);
    if (!id || isNaN(id)) {
      toast.error("Ошибка", "Введите корректный ID тикета");
      return;
    }

    setIsLoading(true);
    try {
      const result = await reportsApi.getReassignmentHistory(id);
      setData(result);
    } catch (error) {
      handleApiError(error, { context: "Получить историю переназначений" });
      setData(null);
    } finally {
      setIsLoading(false);
    }
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
        <BackButton href="/dashboard/reports" label="Назад к отчётам" mb={2} />
        <Heading size="xl" color="fg.default" mb={2}>
          История переназначений
        </Heading>
        <Text color="fg.muted">
          История переадресации тикета между специалистами и линиями поддержки
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
            <Button type="submit" loading={isLoading} colorPalette="teal">
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
            gap={8}
          >
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="fg.muted">
                Тикет
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="fg.default">
                #{ticketId}
              </Text>
            </VStack>
            <VStack align="start" gap={0}>
              <Text fontSize="xs" color="fg.muted">
                Всего переназначений
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="teal.600">
                {data.length}
              </Text>
            </VStack>
          </HStack>

          {data.length === 0 ? (
            <Flex justify="center" py={10}>
              <Text color="fg.muted">Нет истории переназначений</Text>
            </Flex>
          ) : (
            <Table.Root size="md">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Откуда</Table.ColumnHeader>
                  <Table.ColumnHeader w="40px"></Table.ColumnHeader>
                  <Table.ColumnHeader>Куда</Table.ColumnHeader>
                  <Table.ColumnHeader>Режим</Table.ColumnHeader>
                  <Table.ColumnHeader>Статус</Table.ColumnHeader>
                  <Table.ColumnHeader>Дата</Table.ColumnHeader>
                  <Table.ColumnHeader>Примечание</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row) => (
                  <Table.Row key={row.assignmentId}>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        {row.fromUserFio && (
                          <Text fontSize="sm" fontWeight="medium">
                            {row.fromUserFio}
                          </Text>
                        )}
                        {row.fromLine && (
                          <Text fontSize="xs" color="fg.muted">
                            {row.fromLine}
                          </Text>
                        )}
                        {!row.fromUserFio && !row.fromLine && (
                          <Text fontSize="sm" color="fg.muted">
                            —
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <LuArrowRight size={16} color="gray" />
                    </Table.Cell>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        {row.toUserFio && (
                          <Text fontSize="sm" fontWeight="medium">
                            {row.toUserFio}
                          </Text>
                        )}
                        {row.toLine && (
                          <Text fontSize="xs" color="fg.muted">
                            {row.toLine}
                          </Text>
                        )}
                        {!row.toUserFio && !row.toLine && (
                          <Text fontSize="sm" color="fg.muted">
                            —
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm">
                        {assignmentModeConfig[row.mode] || row.mode}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={
                          assignmentStatusConfig[
                            row.status as keyof typeof assignmentStatusConfig
                          ]?.color || "gray"
                        }
                        size="sm"
                      >
                        {assignmentStatusConfig[
                          row.status as keyof typeof assignmentStatusConfig
                        ]?.label || row.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm">{formatDate(row.createdAt)}</Text>
                        {row.acceptedAt && (
                          <Text fontSize="xs" color="green.600">
                            Принято: {formatDate(row.acceptedAt)}
                          </Text>
                        )}
                        {row.rejectedAt && (
                          <Text fontSize="xs" color="red.600">
                            Отклонено: {formatDate(row.rejectedAt)}
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        {row.note && (
                          <Text
                            fontSize="sm"
                            color="fg.muted"
                            maxW="150px"
                            truncate
                          >
                            {row.note}
                          </Text>
                        )}
                        {row.rejectedReason && (
                          <Text
                            fontSize="xs"
                            color="red.600"
                            maxW="150px"
                            truncate
                          >
                            Причина: {row.rejectedReason}
                          </Text>
                        )}
                        {!row.note && !row.rejectedReason && (
                          <Text fontSize="sm" color="fg.muted">
                            —
                          </Text>
                        )}
                      </VStack>
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
