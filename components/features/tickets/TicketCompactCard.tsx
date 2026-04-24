"use client";

import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  TicketListResponse,
  ticketPriorityConfig,
  ticketStatusConfig,
} from "@/types/ticket";
import { LuCheck, LuUserCheck, LuUserX, LuX } from "react-icons/lu";
import { Tooltip } from "@/components/ui";

interface TicketCompactCardProps {
  ticket: TicketListResponse;
  currentUserName: string | undefined;
}

export function TicketCompactCard({
  ticket,
  currentUserName,
}: TicketCompactCardProps) {
  const router = useRouter();
  const priorityConf = ticketPriorityConfig[ticket.priority];
  const statusConf = ticketStatusConfig[ticket.status];

  const isAssignedToMe = ticket.assignedTo?.username === currentUserName;

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

        {/* Closed status icon */}
        {ticket.status === "CLOSED" &&
          (isAssignedToMe ? (
            <Tooltip content="Тикет закрыт вами">
              <Flex
                w="18px"
                h="18px"
                borderRadius="full"
                bg="green.subtle"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuCheck size={11} color="var(--chakra-colors-green-600)" />
              </Flex>
            </Tooltip>
          ) : (
            <Tooltip content="Тикет закрыт другим пользователем">
              <Flex
                w="18px"
                h="18px"
                borderRadius="full"
                bg="red.subtle"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuX size={11} color="var(--chakra-colors-red-600)" />
              </Flex>
            </Tooltip>
          ))}

        {/* Open assignment icon */}
        {ticket.status === "OPEN" &&
          (isAssignedToMe ? (
            <Tooltip content="Вы исполнитель">
              <Flex
                w="18px"
                h="18px"
                borderRadius="full"
                bg="green.subtle"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuUserCheck size={11} color="var(--chakra-colors-green-600)" />
              </Flex>
            </Tooltip>
          ) : (
            <Tooltip content="Заявкой занимается другой специалист">
              <Flex
                w="18px"
                h="18px"
                borderRadius="full"
                bg="red.subtle"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuUserX size={11} color="var(--chakra-colors-red-600)" />
              </Flex>
            </Tooltip>
          ))}
      </Flex>

      {/* Row 2: Priority dot + label + Status pill */}
      <Flex align="center" gap={2}>
        {/* Priority */}
        <HStack gap={1.5}>
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
