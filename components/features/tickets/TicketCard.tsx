"use client";

import { Box, Flex, Text, Badge, HStack } from "@chakra-ui/react";
import { LuClock } from "react-icons/lu";
import { useRouter } from "next/navigation";
import type { TicketListItem } from "@/types/ticket";
import { ticketStatusConfig, ticketPriorityConfig } from "@/types/ticket";
import { formatDate } from "@/lib/utils";

interface TicketCardProps {
  ticket: TicketListItem;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter();
  const statusConf = ticketStatusConfig[ticket.status];
  const priorityConf = ticketPriorityConfig[ticket.priority];

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={4}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: "gray.400",
        shadow: "sm",
      }}
      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
    >
      <Flex align="center" justify="space-between" gap={4}>
        {/* Left: ID + Title */}
        <Flex align="center" gap={4} flex={1} minW={0}>
          <Text
            fontSize="sm"
            color="fg.muted"
            fontWeight="medium"
            flexShrink={0}
          >
            #{ticket.id}
          </Text>
          <Text fontWeight="medium" color="fg.default" truncate flex={1}>
            {ticket.title}
          </Text>
        </Flex>

        {/* Center: Author/Assignee */}
        <Text
          fontSize="sm"
          color="fg.muted"
          display={{ base: "none", md: "block" }}
          flexShrink={0}
          w="150px"
        >
          {ticket.assignedToUsername || ticket.createdByUsername}
        </Text>

        {/* Right: Badges + Date */}
        <HStack gap={3} flexShrink={0}>
          <Badge
            colorPalette={priorityConf.color}
            variant="subtle"
            size="sm"
            display={{ base: "none", sm: "flex" }}
          >
            {priorityConf.label}
          </Badge>
          <Badge colorPalette={statusConf.color} size="sm">
            {statusConf.label}
          </Badge>
          <HStack
            fontSize="xs"
            color="fg.muted"
            display={{ base: "none", lg: "flex" }}
          >
            <LuClock size={12} />
            <Text>{formatDate(ticket.createdAt)}</Text>
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
}
