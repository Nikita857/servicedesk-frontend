"use client";

import { Box, Flex, Text, Badge, HStack } from "@chakra-ui/react";
import { LuClock, LuUser } from "react-icons/lu";
import { useRouter } from "next/navigation";
import type { TicketListResponse } from "@/types/ticket";
import { ticketStatusConfig, ticketPriorityConfig } from "@/types/ticket";
import { formatDate } from "@/lib/utils";
import PriorityBadge from "@/components/ui/ticket/PriorityBadge";

interface TicketCardProps {
  ticket: TicketListResponse;
  unreadCount?: number;
}

export function TicketCard({ ticket, unreadCount = 0 }: TicketCardProps) {
  const router = useRouter();
  const statusConf = ticketStatusConfig[ticket.status];
  const priorityConf = ticketPriorityConfig[ticket.priority];

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      px={4}
      py={3}
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        borderColor: "accent.200",
        shadow: "sm",
        bg: "bg.subtle",
      }}
      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
    >
      {/* Row 1: ID + Title + Status + Unread */}
      <Flex align="center" gap={2.5} mb={2}>
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
          color="fg.default"
          fontSize="sm"
          flex={1}
          truncate
        >
          {ticket.title}
        </Text>

        {/* Status dot + label */}
        <HStack
          gap={1.5}
          bg={`${statusConf.color}.subtle`}
          borderRadius="full"
          px={2.5}
          py={0.5}
          flexShrink={0}
        >
          <Box
            w="5px"
            h="5px"
            borderRadius="full"
            bg={`${statusConf.color}.500`}
          />
          <Text
            fontSize="xs"
            fontWeight="medium"
            color={`${statusConf.color}.600`}
          >
            {statusConf.label}
          </Text>
        </HStack>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <Flex
            w="18px"
            h="18px"
            borderRadius="full"
            bg="accent.600"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text fontSize="10px" fontWeight="bold" color="white">
              {unreadCount}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Row 2: Priority + Assignee + Date */}
      <Flex align="center" gap={3}>
        {/* Priority badge */}
        <PriorityBadge color={priorityConf.color} label={priorityConf.label} />

        {/* Assignee / Author */}
        <HStack gap={1} color="fg.muted" fontSize="xs">
          <LuUser size={11} />
          <Text>{ticket.createdBy.fio}</Text>
        </HStack>

        {/* Date — pushed to the right */}
        <HStack gap={1} color="fg.subtle" fontSize="xs" ml="auto">
          <LuClock size={11} />
          <Text>{formatDate(ticket.createdAt)}</Text>
        </HStack>
      </Flex>
    </Box>
  );
}
