"use client";

import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Portal,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useScheduledTaskExecutionsQuery } from "@/lib/hooks/scheduled-tasks";
import { formatDate } from "@/lib/utils";

interface IProps {
  open: boolean;
  onClose: () => void;
  taskId: number | null;
}

export default function ScheduledTaskExecutionsDialog({ open, onClose, taskId }: IProps) {
  const { data: executions = [], isLoading } = useScheduledTaskExecutionsQuery(
    taskId ?? 0,
  );

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="680px" maxH="80vh" overflow="auto">
            <Dialog.Header>
              <Dialog.Title>История выполнений</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner />
                </Flex>
              ) : executions.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="fg.muted">Задача ещё не запускалась</Text>
                </Box>
              ) : (
                <Box
                  borderWidth="1px"
                  borderColor="border.default"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Время</Table.ColumnHeader>
                        <Table.ColumnHeader>Статус</Table.ColumnHeader>
                        <Table.ColumnHeader>Тикет</Table.ColumnHeader>
                        <Table.ColumnHeader>Ошибка</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {executions.map((ex) => (
                        <Table.Row key={ex.id}>
                          <Table.Cell whiteSpace="nowrap">
                            {formatDate(ex.executedAt)}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge
                              colorPalette={ex.success ? "green" : "red"}
                              variant="subtle"
                              size="sm"
                            >
                              {ex.success ? "Успешно" : "Ошибка"}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            {ex.ticketId ? (
                              <Link href={`/dashboard/tickets/${ex.ticketId}`}>
                                <Text
                                  color="accent.600"
                                  _hover={{ textDecoration: "underline" }}
                                  fontSize="sm"
                                >
                                  #{ex.ticketId}
                                </Text>
                              </Link>
                            ) : (
                              <Text color="fg.muted" fontSize="sm">—</Text>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Text fontSize="xs" color="red.500" maxW="200px" truncate>
                              {ex.errorMessage ?? "—"}
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
