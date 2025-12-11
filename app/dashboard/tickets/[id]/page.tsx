"use client";

import { useState, useEffect, use, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Spinner,
  HStack,
  VStack,
  Grid,
  GridItem,
  Separator,
  Textarea,
  Portal,
  createListCollection,
  Menu,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuClock,
  LuUser,
  LuMessageSquare,
  LuPaperclip,
  LuForward,
  LuUserPlus,
  LuHistory,
  LuChevronDown,
  LuPlay,
  LuCircleX,
} from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketApi } from "@/lib/api/tickets";
import {
  supportLineApi,
  Specialist,
  SupportLine,
} from "@/lib/api/supportLines";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import { TicketChat } from "@/components/features/tickets";
import type { Ticket, TicketStatus } from "@/types/ticket";
import {
  ticketStatusConfig,
  ticketPriorityConfig,
  statusTransitions,
  userStatusTransitions,
} from "@/types/ticket";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  // Check if user can escalate (all specialists can escalate)
  const canEscalate = isSpecialist;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escalation state
  const [showEscalation, setShowEscalation] = useState(false);
  const [supportLines, setSupportLines] = useState<SupportLine[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    number | undefined
  >();
  const [escalationComment, setEscalationComment] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(false);
  const [isOnLastLine, setIsOnLastLine] = useState(false);

  // Assignment history
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(
    null
  );
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load ticket and assignment info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ticketData = await ticketApi.get(Number(id));
        setTicket(ticketData);

        // Load current assignment
        const current = await assignmentApi.getCurrentForTicket(Number(id));
        setCurrentAssignment(current);

        // Load assignment history
        const history = await assignmentApi.getTicketHistory(Number(id));
        setAssignmentHistory(history);
      } catch (error) {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось загрузить тикет",
        });
        router.push("/dashboard/tickets");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  // Load support lines and determine if on last line (DEVELOPER line)
  useEffect(() => {
    const loadSupportLines = async () => {
      try {
        const lines = await supportLineApi.getAll();
        setSupportLines(lines);

        // Determine if ticket is on the DEVELOPER line (last/3rd line)
        // Check by line name containing DEVELOPER-related keywords or by max displayOrder
        if (ticket?.supportLine && lines.length > 0) {
          const ticketLineName = ticket.supportLine.name?.toLowerCase() || "";

          // Check if current line is DEVELOPER line by name
          const isDeveloperLine =
            ticketLineName.includes("developer") ||
            ticketLineName.includes("разработ") ||
            ticketLineName.includes("3 линия") ||
            ticketLineName.includes("третья");

          // Fallback: check by displayOrder if name check doesn't match
          if (!isDeveloperLine) {
            const maxDisplayOrder = Math.max(
              ...lines.map((l) => l.displayOrder || 0)
            );
            const ticketLineOrder = ticket.supportLine.displayOrder || 0;
            // Only consider as last line if displayOrder is actually set and is the max
            setIsOnLastLine(
              ticketLineOrder > 0 && ticketLineOrder >= maxDisplayOrder
            );
          } else {
            setIsOnLastLine(true);
          }
        }
      } catch (error) {
        console.error("Failed to load support lines", error);
      }
    };

    if (ticket) {
      loadSupportLines();
    }
  }, [ticket]);

  // Load specialists when line is selected
  useEffect(() => {
    if (selectedLineId) {
      setIsLoadingSpecialists(true);
      setSpecialists([]);
      setSelectedSpecialistId(undefined);

      supportLineApi
        .getSpecialists(selectedLineId)
        .then(setSpecialists)
        .catch(console.error)
        .finally(() => setIsLoadingSpecialists(false));
    } else {
      setSpecialists([]);
      setSelectedSpecialistId(undefined);
    }
  }, [selectedLineId]);

  // Collections for selects
  const lineCollection = useMemo(
    () =>
      createListCollection({
        items: supportLines.map((l) => ({
          label: l.name,
          value: String(l.id),
        })),
      }),
    [supportLines]
  );

  const specialistCollection = useMemo(
    () =>
      createListCollection({
        items: specialists.map((s) => ({
          label: s.fio || s.username,
          value: String(s.id),
        })),
      }),
    [specialists]
  );

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const updated = await ticketApi.changeStatus(ticket.id, {
        status: newStatus,
      });
      setTicket(updated);
      toaster.success({
        title: "Статус изменен",
        description: `Тикет переведен в статус "${ticketStatusConfig[newStatus].label}"`,
      });
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось изменить статус",
      });
    }
  };

  const handleEscalate = async () => {
    if (!ticket || !selectedLineId || !escalationComment.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Выберите линию поддержки и укажите комментарий",
      });
      return;
    }

    setIsEscalating(true);
    try {
      // Use the new assignments API
      const assignment = await assignmentApi.create({
        ticketId: ticket.id,
        toLineId: selectedLineId,
        toUserId: selectedSpecialistId,
        fromLineId: ticket.supportLine?.id,
        fromUserId: user?.id,
        note: escalationComment,
        mode: selectedSpecialistId ? "DIRECT" : "FIRST_AVAILABLE",
      });

      toaster.success({
        title: "Тикет переадресован",
        description: selectedSpecialistId
          ? "Тикет назначен на специалиста"
          : "Тикет передан на линию поддержки",
      });

      // Refresh ticket and assignment data
      const updatedTicket = await ticketApi.get(ticket.id);
      setTicket(updatedTicket);
      setCurrentAssignment(assignment);
      setAssignmentHistory((prev) => [assignment, ...prev]);

      // Reset form
      setShowEscalation(false);
      setSelectedLineId(undefined);
      setSelectedSpecialistId(undefined);
      setEscalationComment("");
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось переадресовать тикет",
      });
    } finally {
      setIsEscalating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!ticket) return null;

  const statusConf = ticketStatusConfig[ticket.status];
  const priorityConf = ticketPriorityConfig[ticket.priority];

  return (
    <Box>
      {/* Header */}
      <Flex
        mb={6}
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap={4}
      >
        <Box>
          <HStack mb={2}>
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="sm">
                <LuArrowLeft />
                Назад
              </Button>
            </Link>
          </HStack>
          <Heading size="lg" color="fg.default" mb={2}>
            #{ticket.id}: {ticket.title}
          </Heading>
          <HStack gap={3}>
            <Badge colorPalette={statusConf.color} size="lg">
              {statusConf.label}
            </Badge>
            <Badge colorPalette={priorityConf.color} variant="subtle" size="md">
              {priorityConf.label}
            </Badge>
          </HStack>
        </Box>

        {/* Action buttons */}
        <HStack gap={2}>
          {/* Take Ticket button - for specialists when ticket is unassigned */}
          {isSpecialist && !ticket.assignedTo && ticket.status === "NEW" && (
            <Button
              size="sm"
              colorPalette="green"
              onClick={async () => {
                try {
                  const updated = await ticketApi.takeTicket(ticket.id);
                  setTicket(updated);
                  toaster.success({
                    title: "Успех",
                    description: "Тикет взят в работу",
                  });
                } catch (error) {
                  toaster.error({
                    title: "Ошибка",
                    description: "Не удалось взять тикет",
                  });
                }
              }}
            >
              <LuPlay />
              Взять в работу
            </Button>
          )}

          {/* Escalate button - only for specialists, disabled on last line */}
          {canEscalate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEscalation(!showEscalation)}
              disabled={isOnLastLine}
              opacity={isOnLastLine ? 0.5 : 1}
              title={
                isOnLastLine
                  ? "Тикет уже на последней линии поддержки"
                  : undefined
              }
            >
              <LuForward />
              {isOnLastLine ? "На последней линии" : "Переадресовать"}
            </Button>
          )}

          {/* Status change menu - only for specialists */}
          {isSpecialist &&
            (() => {
              const availableTransitions = statusTransitions[ticket.status];

              if (availableTransitions.length === 0) return null;

              return (
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button size="sm" variant="outline">
                      Изменить статус
                      <LuChevronDown />
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        {availableTransitions.map((status) => {
                          const conf = ticketStatusConfig[status];
                          return (
                            <Menu.Item
                              key={status}
                              value={status}
                              onClick={() => handleStatusChange(status)}
                            >
                              <Badge colorPalette={conf.color} size="sm" mr={2}>
                                {conf.label}
                              </Badge>
                            </Menu.Item>
                          );
                        })}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              );
            })()}
        </HStack>
      </Flex>

      {/* Escalation Panel */}
      {showEscalation && (
        <Box
          mb={6}
          bg="orange.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="orange.200"
          p={6}
          _dark={{ bg: "orange.900/20", borderColor: "orange.700" }}
        >
          <HStack mb={4}>
            <LuForward />
            <Heading size="sm" color="fg.default">
              Переадресация тикета
            </Heading>
          </HStack>

          <VStack gap={4} align="stretch">
            {/* Support Line Select */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Линия поддержки *
              </Text>
              <Select.Root
                collection={lineCollection}
                value={selectedLineId ? [String(selectedLineId)] : []}
                onValueChange={(e) =>
                  setSelectedLineId(Number(e.value[0]) || undefined)
                }
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Выберите линию" />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {lineCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>

            {/* Specialist Select (appears when line selected) */}
            {selectedLineId && (
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">
                  Назначить специалисту (опционально)
                </Text>
                <Select.Root
                  collection={specialistCollection}
                  value={
                    selectedSpecialistId ? [String(selectedSpecialistId)] : []
                  }
                  onValueChange={(e) =>
                    setSelectedSpecialistId(Number(e.value[0]) || undefined)
                  }
                  disabled={isLoadingSpecialists || specialists.length === 0}
                >
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder={
                        isLoadingSpecialists
                          ? "Загрузка..."
                          : specialists.length === 0
                          ? "Нет специалистов"
                          : "Любой специалист линии"
                      }
                    />
                  </Select.Trigger>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {specialistCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>
            )}

            {/* Comment - REQUIRED */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Комментарий *
              </Text>
              <Textarea
                value={escalationComment}
                onChange={(e) => setEscalationComment(e.target.value)}
                placeholder="Причина переадресации (обязательно)..."
                minH="80px"
                bg="bg.surface"
              />
            </Box>

            {/* Actions */}
            <HStack justify="flex-end" gap={2}>
              <Button variant="ghost" onClick={() => setShowEscalation(false)}>
                Отмена
              </Button>
              <Button
                bg="orange.500"
                color="white"
                _hover={{ bg: "orange.600" }}
                onClick={handleEscalate}
                loading={isEscalating}
                disabled={!selectedLineId || !escalationComment.trim()}
              >
                <LuUserPlus />
                Переадресовать
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Main content */}
        <GridItem>
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <Heading size="md" mb={4} color="fg.default">
              Описание
            </Heading>
            <Text color="fg.default" whiteSpace="pre-wrap">
              {ticket.description}
            </Text>

            {ticket.link1c && (
              <Box mt={4} p={3} bg="bg.subtle" borderRadius="lg">
                <Text fontSize="sm" color="fg.muted">
                  Ссылка 1С: {ticket.link1c}
                </Text>
              </Box>
            )}
          </Box>

          {/* Messages section */}
          <Box mt={6}>
            <TicketChat ticketId={ticket.id} />
          </Box>
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <VStack gap={4} align="stretch">
            {/* Main Info */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <Heading size="md" mb={4} color="fg.default">
                Информация
              </Heading>

              <VStack gap={4} align="stretch">
                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Автор
                  </Text>
                  <HStack>
                    <LuUser size={16} />
                    <Text color="fg.default">
                      {ticket.createdBy.fio || ticket.createdBy.username}
                    </Text>
                  </HStack>
                </Box>

                <Separator />

                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Исполнитель
                  </Text>
                  <Text color="fg.default">
                    {ticket.assignedTo
                      ? ticket.assignedTo.fio || ticket.assignedTo.username
                      : "—"}
                  </Text>
                </Box>

                <Separator />

                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Линия поддержки
                  </Text>
                  <Text color="fg.default">
                    {ticket.supportLine?.name || "—"}
                  </Text>
                </Box>

                <Separator />

                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Категория
                  </Text>
                  <Text color="fg.default">
                    {ticket.categoryUser?.name || "—"}
                  </Text>
                </Box>

                <Separator />

                <HStack justify="space-between">
                  <HStack color="fg.muted" fontSize="sm">
                    <LuClock size={14} />
                    <Text>{formatDuration(ticket.timeSpentSeconds)}</Text>
                  </HStack>
                  <HStack color="fg.muted" fontSize="sm">
                    <LuMessageSquare size={14} />
                    <Text>{ticket.messageCount}</Text>
                  </HStack>
                  <HStack color="fg.muted" fontSize="sm">
                    <LuPaperclip size={14} />
                    <Text>{ticket.attachmentCount}</Text>
                  </HStack>
                </HStack>

                <Separator />

                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    mb={1}
                  >
                    Создан
                  </Text>
                  <Text color="fg.default" fontSize="sm">
                    {formatDate(ticket.createdAt)}
                  </Text>
                </Box>

                {ticket.resolvedAt && (
                  <Box>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="uppercase"
                      mb={1}
                    >
                      Решён
                    </Text>
                    <Text color="fg.default" fontSize="sm">
                      {formatDate(ticket.resolvedAt)}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Current Assignment */}
            {currentAssignment && (
              <Box
                bg="blue.50"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="blue.200"
                p={4}
                _dark={{ bg: "blue.900/20", borderColor: "blue.700" }}
              >
                <HStack mb={2}>
                  <LuForward size={16} />
                  <Text fontWeight="medium" fontSize="sm">
                    Текущее назначение
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2} fontSize="sm">
                  <Text>
                    <Text as="span" color="fg.muted">
                      Кому:{" "}
                    </Text>
                    {currentAssignment.toFio ||
                      currentAssignment.toUsername ||
                      currentAssignment.toLineName}
                  </Text>
                  {currentAssignment.fromFio && (
                    <Text>
                      <Text as="span" color="fg.muted">
                        От:{" "}
                      </Text>
                      {currentAssignment.fromFio ||
                        currentAssignment.fromUsername}
                    </Text>
                  )}
                  <Text>
                    <Text as="span" color="fg.muted">
                      Комментарий:{" "}
                    </Text>
                    {currentAssignment.note}
                  </Text>
                  <Badge
                    size="sm"
                    colorPalette={
                      currentAssignment.status === "ACCEPTED"
                        ? "green"
                        : currentAssignment.status === "REJECTED"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {currentAssignment.status === "ACCEPTED"
                      ? "Принято"
                      : currentAssignment.status === "REJECTED"
                      ? "Отклонено"
                      : "Ожидает"}
                  </Badge>
                </VStack>
              </Box>
            )}

            {/* Rejection Info - only for specialists when lastAssignment is rejected */}
            {isSpecialist && ticket.lastAssignment?.status === "REJECTED" && (
              <Box
                bg="red.50"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="red.200"
                p={4}
                _dark={{ bg: "red.900/20", borderColor: "red.700" }}
              >
                <HStack mb={2}>
                  <LuCircleX size={16} color="var(--chakra-colors-red-500)" />
                  <Text
                    fontWeight="medium"
                    fontSize="sm"
                    color="red.600"
                    _dark={{ color: "red.400" }}
                  >
                    Назначение отклонено
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2} fontSize="sm">
                  <Text>
                    <Text as="span" color="fg.muted">
                      Отклонил:{" "}
                    </Text>
                    {ticket.lastAssignment.toFio ||
                      ticket.lastAssignment.toUsername}
                  </Text>
                  {ticket.lastAssignment.rejectedAt && (
                    <Text>
                      <Text as="span" color="fg.muted">
                        Дата:{" "}
                      </Text>
                      {new Date(
                        ticket.lastAssignment.rejectedAt
                      ).toLocaleString("ru-RU")}
                    </Text>
                  )}
                  {ticket.lastAssignment.rejectedReason && (
                    <Box>
                      <Text color="fg.muted" mb={1}>
                        Причина:
                      </Text>
                      <Text
                        bg="white"
                        p={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="red.100"
                        _dark={{ bg: "red.900/40", borderColor: "red.600" }}
                      >
                        {ticket.lastAssignment.rejectedReason}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Assignment History - only for specialists */}
            {isSpecialist && assignmentHistory.length > 0 && (
              <Box
                bg="bg.surface"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                p={4}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <LuHistory size={16} />
                    <Text fontWeight="medium" fontSize="sm">
                      История назначений ({assignmentHistory.length})
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? "Скрыть" : "Показать"}
                  </Button>
                </HStack>

                {showHistory && (
                  <VStack align="stretch" gap={3} mt={3}>
                    {assignmentHistory.map((a) => (
                      <Box
                        key={a.id}
                        p={2}
                        bg="bg.subtle"
                        borderRadius="md"
                        fontSize="xs"
                      >
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="medium">{a.toLineName}</Text>
                          <Text color="fg.muted">
                            {formatDate(a.createdAt)}
                          </Text>
                        </HStack>
                        {a.note && (
                          <Text color="fg.muted" lineClamp={2}>
                            {a.note}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
}
