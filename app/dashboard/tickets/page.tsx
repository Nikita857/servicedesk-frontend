"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  HStack,
  VStack,
  IconButton,
  Portal,
  createListCollection,
  Badge,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuPlus, LuChevronLeft, LuChevronRight, LuBell } from "react-icons/lu";
import Link from "next/link";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import type { TicketListItem, PagedTicketList } from "@/types/ticket";
import { TicketCard } from "@/components/features/tickets";

type FilterType = "unprocessed" | "my" | "assigned" | "pending";

export default function TicketsPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const username = user?.username;
  const userRoles = user?.roles || [];
  const canCreateTicket =
    userRoles.includes("USER") || userRoles.includes("ADMIN");

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<FilterType>(
    isSpecialist ? "unprocessed" : "my"
  );

  const [pendingCount, setPendingCount] = useState(0);
  const [assignedToMeCount, setAssignedToMeCount] = useState(0);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  // ------------------------------------------------
  // Correct counters calculation
  // ------------------------------------------------
  // Counter loader - extracted to callback for reuse
  const loadCounts = useCallback(async () => {
    if (!isSpecialist) return;

    try {
      const all = await ticketApi.listAllDB(0, 9999);

      const assigned = all.content.filter(
        (t) => t.assignedToUsername && t.assignedToUsername === username
      ).length;

      const unprocessed = all.content.filter(
        (t) =>
          (!t.assignedToUsername || t.assignedToUsername.trim() === "") &&
          t.status === "NEW"
      ).length;

      const pending = await assignmentApi.getPendingCount();

      setAssignedToMeCount(assigned);
      setUnprocessedCount(unprocessed);
      setPendingCount(pending);
    } catch (e) {
      console.error("Ошибка вычисления счётчиков", e);
    }
  }, [isSpecialist, username]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // ------------------------------------------------
  // Ticket loader
  // ------------------------------------------------
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      if (filter === "pending") {
        const response = await assignmentApi.getMyPending(page, 5);
        setPendingAssignments(response.content);
        setTickets([]);
        setTotalPages(response.totalPages);
      } else {
        let response: PagedTicketList;

        switch (filter) {
          case "my":
            response = await ticketApi.listMy(page, 5);
            break;

          case "assigned":
            response = await ticketApi.listAssigned(page, 5);
            break;

          case "unprocessed":
            response = await ticketApi.list(page, 5);
            response = {
              ...response,
              content: response.content.filter((t) => t.status === "NEW"),
            };
            break;

          default:
            response = await ticketApi.listMy(page, 5);
        }

        setTickets(response.content);
        setPendingAssignments([]);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось загрузить список тикетов",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ------------------------------------------------
  // Auto-switch filter for non-specialists
  // ------------------------------------------------
  useEffect(() => {
    if (!isSpecialist && filter !== "my") {
      setFilter("my");
    }
  }, [isSpecialist, filter]);

  // ------------------------------------------------
  // Filter dropdown collection
  // ------------------------------------------------
  const filterCollection = useMemo(() => {
    if (isSpecialist) {
      return createListCollection({
        items: [
          {
            label: `Необработанные: (${unprocessedCount})`,
            value: "unprocessed",
          },
          {
            label: `Назначенные мне: (${assignedToMeCount})`,
            value: "assigned",
          },
          {
            label: `Ожидающие: (${pendingCount})`,
            value: "pending",
          },
        ],
      });
    }

    return createListCollection({
      items: [{ label: "Мои тикеты", value: "my" }],
    });
  }, [isSpecialist, unprocessedCount, assignedToMeCount, pendingCount]);

  // ------------------------------------------------
  // Assignment actions
  // ------------------------------------------------
  const handleAcceptAssignment = async (id: number) => {
    try {
      await assignmentApi.accept(id);
      toaster.success({ title: "Назначение принято" });
      await fetchTickets();
      await loadCounts(); // Refresh all counters
    } catch {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось принять назначение",
      });
    }
  };

  const handleRejectAssignment = async (id: number) => {
    const reason = prompt("Укажите причину отклонения:");
    if (!reason) return;

    try {
      await assignmentApi.reject(id, reason);
      toaster.success({ title: "Назначение отклонено" });
      await fetchTickets();
      await loadCounts(); // Refresh all counters
    } catch {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось отклонить назначение",
      });
    }
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <Box>
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            {isSpecialist ? "Тикеты" : "Мои заявки"}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление обращениями
          </Text>
        </Box>

        <HStack gap={3}>
          {isSpecialist && (
            <Select.Root
              collection={filterCollection}
              value={[filter]}
              onValueChange={(e) => {
                setFilter(e.value[0] as FilterType);
                setPage(0);
              }}
              size="sm"
              width="200px"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Фильтр" />
              </Select.Trigger>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {filterCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          )}

          {canCreateTicket && (
            <Link href="/dashboard/tickets/new">
              <Button
                size="sm"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
              >
                <LuPlus />
                Новый тикет
              </Button>
            </Link>
          )}
        </HStack>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : filter === "pending" ? (
        pendingAssignments.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            h="200px"
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
          >
            <LuBell size={48} color="gray" />
            <Text mt={4} color="fg.muted">
              Нет ожидающих назначений
            </Text>
          </Flex>
        ) : (
          <VStack gap={4} align="stretch">
            {pendingAssignments.map((assignment) => (
              <Box
                key={assignment.id}
                bg="yellow.50"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="yellow.200"
                p={4}
                _dark={{ bg: "yellow.900/20", borderColor: "yellow.700" }}
              >
                <Flex
                  justify="space-between"
                  align="flex-start"
                  wrap="wrap"
                  gap={3}
                >
                  <Box>
                    <Link href={`/dashboard/tickets/${assignment.ticketId}`}>
                      <Text
                        fontWeight="medium"
                        color="fg.default"
                        _hover={{ textDecoration: "underline" }}
                      >
                        #{assignment.ticketId}: {assignment.ticketTitle}
                      </Text>
                    </Link>
                    <Text fontSize="sm" color="fg.muted" mt={1}>
                      От:{" "}
                      {assignment.fromFio ||
                        assignment.fromUsername ||
                        assignment.fromLineName ||
                        "—"}
                    </Text>
                    {assignment.note && (
                      <Text fontSize="sm" color="fg.muted" mt={1}>
                        Комментарий: {assignment.note}
                      </Text>
                    )}
                    <Badge mt={2} colorPalette="yellow">
                      Ожидает принятия
                    </Badge>
                  </Box>
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => handleAcceptAssignment(assignment.id)}
                    >
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="red"
                      onClick={() => handleRejectAssignment(assignment.id)}
                    >
                      Отклонить
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )
      ) : tickets.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="200px"
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Text color="fg.muted">Тикеты не найдены</Text>

          {canCreateTicket && (
            <Link href="/dashboard/tickets/new">
              <Button mt={4} size="sm" variant="outline">
                Создать первый тикет
              </Button>
            </Link>
          )}
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </VStack>
      )}

      {totalPages > 1 && (
        <Flex mt={6} justify="center" align="center" gap={4}>
          <IconButton
            aria-label="Previous page"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <LuChevronLeft />
          </IconButton>

          <Text color="fg.muted" fontSize="sm">
            Страница {page + 1} из {totalPages}
          </Text>

          <IconButton
            aria-label="Next page"
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <LuChevronRight />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
}
