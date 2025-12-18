import { Assignment } from "@/lib/api";
import { Ticket } from "@/types";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Separator,
  VStack,
  Text,
} from "@chakra-ui/react";
import {
  LuCircleX,
  LuClock,
  LuForward,
  LuHistory,
  LuMessageSquare,
  LuPaperclip,
  LuUser,
} from "react-icons/lu";

interface TicketSidebarProps {
  ticket: Ticket;
  currentAssignment: Assignment | null;
  isSpecialist: boolean;
  assignmentHistory: Assignment[];
  showHistory: boolean;
  setShowHistory: (arg: boolean) => void;
}

export default function TicketSidebar({
  ticket,
  currentAssignment,
  isSpecialist,
  assignmentHistory,
  showHistory,
  setShowHistory,
}: TicketSidebarProps) {
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

  return (
    <VStack gap={4} align="stretch">
      {/* Rejection Alert - shown when last assignment was rejected */}
      {ticket.lastAssignment?.status === "REJECTED" && (
        <Box
          bg="red.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="red.200"
          p={4}
          _dark={{ bg: "red.900/20", borderColor: "red.700" }}
        >
          <HStack gap={2} mb={2}>
            <LuCircleX color="var(--chakra-colors-red-500)" />
            <Text
              fontWeight="semibold"
              color="red.600"
              _dark={{ color: "red.300" }}
            >
              Переадресация отклонена
            </Text>
          </HStack>
          {ticket.lastAssignment.rejectedReason && (
            <Text fontSize="sm" color="red.700" _dark={{ color: "red.200" }}>
              Причина: {ticket.lastAssignment.rejectedReason}
            </Text>
          )}
          <Text fontSize="xs" color="red.500" mt={2}>
            Отклонено:{" "}
            {ticket.lastAssignment.toFio ||
              ticket.lastAssignment.toUsername ||
              "—"}
          </Text>
        </Box>
      )}

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
                {ticket.createdBy?.fio || ticket.createdBy?.username || "—"}
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
            <Text color="fg.default">{ticket.supportLine?.name || "—"}</Text>
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
            <Text color="fg.default">{ticket.categoryUser?.name || "—"}</Text>
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

          <Separator />

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
                {currentAssignment.fromFio || currentAssignment.fromUsername}
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

      {/* Информация об отклонении переадресации - видит только отправитель */}
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
              {ticket.lastAssignment.toFio || ticket.lastAssignment.toUsername}
            </Text>
            {ticket.lastAssignment.rejectedAt && (
              <Text>
                <Text as="span" color="fg.muted">
                  Дата:{" "}
                </Text>
                {new Date(ticket.lastAssignment.rejectedAt).toLocaleString(
                  "ru-RU"
                )}
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
                    <Text color="fg.muted">{formatDate(a.createdAt)}</Text>
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
  );
}
