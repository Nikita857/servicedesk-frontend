"use client";

import { Box, Flex, Text, Badge, HStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import type { TicketListItem } from "@/types/ticket";
import { ticketPriorityConfig } from "@/types/ticket";
import { LuCheck, LuX } from "react-icons/lu";
import { Tooltip } from "@/components/ui";

interface TicketCompactCardProps {
  ticket: TicketListItem;
  currentUserName: string | undefined;
}

export function TicketCompactCard({
  ticket,
  currentUserName,
}: TicketCompactCardProps) {
  const router = useRouter();
  const priorityConf = ticketPriorityConfig[ticket.priority];

  return (
    <Box
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.subtle"
      px={2.5}
      py={1.5}
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        bg: "bg.muted",
        borderColor: "border.default",
      }}
      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
    >
      <Flex align="center" justify="space-between" gap={2}>
        {/* Left: ID + Title */}
        <HStack gap={2} flex={1} minW={0}>
          <Text
            fontSize="xs"
            color="fg.muted"
            fontWeight="medium"
            flexShrink={0}
          >
            #{ticket.id}
          </Text>
          <Text
            fontWeight="medium"
            fontSize="xs"
            color="fg.default"
            lineClamp={1}
          >
            {ticket.title}
          </Text>
          {ticket.status === "CLOSED" &&
            (ticket.assignedToUsername === currentUserName ? (
              <Tooltip content="Тикет закрыт вами">
                <span>
                  <LuCheck color="green" size={14} />
                </span>
              </Tooltip>
            ) : (
              <Tooltip content="Тикет закрыт другим пользователем">
                <span>
                  <LuX color="red" size={14} />
                </span>
              </Tooltip>
            ))}
        </HStack>

        {/* Right: Priority Badge */}
        <Badge colorPalette={priorityConf.color} variant="subtle" size="xs">
          {priorityConf.label}
        </Badge>
      </Flex>
    </Box>
  );
}
