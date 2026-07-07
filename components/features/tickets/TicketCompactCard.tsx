"use client";

import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  TicketListResponse,
  ticketPriorityConfig,
  ticketStatusConfig,
} from "@/types/ticket";
import { LuArrowUpRight } from "react-icons/lu";
import { TicketHandlerBadge } from "./TicketHandlerBadge";

interface TicketCompactCardProps {
  ticket: TicketListResponse;
}

function getEscalationTarget(ticket: TicketListResponse): string | null {
  if (ticket.status !== "ESCALATED") return null;
  const line = ticket.supportLine?.name ?? "—";
  if (!ticket.assignedTo?.toUser) return line;
  return `${line} (${ticket.assignedTo.toUser.fio ?? ticket.assignedTo.toUser.username})`;
}

export function TicketCompactCard({ ticket }: TicketCompactCardProps) {
  const router = useRouter();
  const priorityConf = ticketPriorityConfig[ticket.priority];
  const statusConf = ticketStatusConfig[ticket.status];

  const escalationTarget = getEscalationTarget(ticket);

  return (
    <Box
      bg="bg.surface"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      px={3}
      py={2}
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        borderColor: "accent.200",
        shadow: "sm",
        bg: "bg.subtle",
      }}
      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
    >
      {/* Row 1: ID + Title + status icon */}
      <Flex align="center" gap={2} mb={1.5}>
        <Text
          fontSize="xs"
          color="fg.subtle"
          fontWeight="semibold"
          flexShrink={0}
        >
          #{ticket.id}
        </Text>

        <Text
          fontWeight="semibold"
          fontSize="xs"
          color="fg.default"
          flex={1}
          truncate
        >
          {ticket.title}
        </Text>
      </Flex>

      {/* Row 2: Priority dot + label + Escalation target + Status pill */}
      <Flex align="center" gap={2}>
        {/* Priority */}
        <HStack gap={1.5} flexShrink={0}>
          <Box
            w="5px"
            h="5px"
            borderRadius="full"
            bg={`${priorityConf.color}.500`}
            flexShrink={0}
          />
          <Text
            fontSize="10px"
            fontWeight="medium"
            color={`${priorityConf.color}.600`}
          >
            {priorityConf.label}
          </Text>
        </HStack>

        {/* Handler / pool — кто занимается заявкой */}
        <TicketHandlerBadge ticket={ticket} />

        {/* Escalation target */}
        {escalationTarget && (
          <HStack gap={1} color="orange.600" flex={1} minW={0}>
            <LuArrowUpRight size={10} />
            <Text fontSize="10px" truncate>
              {escalationTarget}
            </Text>
          </HStack>
        )}

        {/* Status pill */}
        <HStack
          gap={1.5}
          bg={`${statusConf.color}.subtle`}
          borderRadius="full"
          px={2}
          py="1px"
          ml="auto"
          flexShrink={0}
        >
          <Box
            w="4px"
            h="4px"
            borderRadius="full"
            bg={`${statusConf.color}.500`}
          />
          <Text
            fontSize="10px"
            fontWeight="medium"
            color={`${statusConf.color}.600`}
          >
            {statusConf.label}
          </Text>
        </HStack>
      </Flex>
    </Box>
  );
}
