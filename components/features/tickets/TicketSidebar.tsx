import { Ticket } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  Box,
  Heading,
  HStack,
  Separator,
  VStack,
  Text,
} from "@chakra-ui/react";
import {
  LuCircleX,
  LuClock,
  LuMessageSquare,
  LuPaperclip,
  LuUser,
} from "react-icons/lu";

interface TicketSidebarProps {
  ticket: Ticket;
  isSpecialist: boolean;
}

/**
 * Рассчитывает время работы над тикетом в секундах.
 * Если тикет закрыт - разница между createdAt и closedAt.
 * Если не закрыт - разница между createdAt и текущим временем.
 */
function calculateTimeSpent(ticket: Ticket): number {
  const createdAt = new Date(ticket.createdAt).getTime();
  const endTime = ticket.closedAt
    ? new Date(ticket.closedAt).getTime()
    : Date.now();

  return Math.floor((endTime - createdAt) / 1000);
}

export default function TicketSidebar({
  ticket,
  isSpecialist,
}: TicketSidebarProps) {
  const timeSpentSeconds = calculateTimeSpent(ticket);

  return (
    <VStack gap={4} align="stretch">
      {/* Rejection Alert - shown when last assignment was rejected (only for specialists) */}
      {isSpecialist && ticket.lastAssignment?.status === "REJECTED" && (
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
          <Text fontSize="xs" color="red.500">
            Дата: {formatDate(ticket.lastAssignment.rejectedAt || "")}
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
              <Text>{formatDuration(timeSpentSeconds)}</Text>
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
    </VStack>
  );
}
