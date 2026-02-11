"use client";

import {
  Box,
  Flex,
  Text,
  VStack,
  Spinner,
  IconButton,
  HStack,
  Portal,
  Badge,
} from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api/stats";

import type { TicketListItem, TicketStatus } from "@/types/ticket";
import { ticketStatusConfig, ticketPriorityConfig } from "@/types/ticket";
import { useState } from "react";
import { SDPagination } from "@/components/ui/SDPagination";

const PAGE_SIZE = 5;

interface TicketListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  status: TicketStatus[] | null;
  lineId: number | null;
}

export function TicketListModal({
  isOpen,
  onClose,
  title,
  status,
  lineId,
}: TicketListModalProps) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["stats", "by-line-with-tickets", lineId, status, page],
    queryFn: () =>
      statsApi.listBySupportLineAndStatus({
        ticketStatus: status!,
        lineId: lineId!,
        page,
        size: PAGE_SIZE,
      }),
    enabled: isOpen && status !== null && lineId !== null,
  });

  const tickets = data?.content ?? [];
  const totalPages = data?.page?.totalPages ?? 0;

  // Reset page when modal opens with a new status
  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open) {
      onClose();
      setPage(0);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange} size="lg">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" borderRadius="xl" maxH="80vh" mx={{ base: 4, md: 0 }}>
            <Dialog.Header borderBottomWidth="1px" borderColor="border.default">
              <Flex justify="space-between" align="center" w="full">
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  {title}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm" aria-label="Закрыть">
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body overflowY="auto" py={4}>
              {isLoading ? (
                <Flex justify="center" align="center" py={10}>
                  <Spinner />
                </Flex>
              ) : tickets.length === 0 ? (
                <Flex justify="center" align="center" py={10}>
                  <Text color="fg.muted">Тикеты не найдены</Text>
                </Flex>
              ) : (
                <VStack gap={2} align="stretch">
                  {tickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
                  ))}
                </VStack>
              )}
            </Dialog.Body>

            {data != null && (totalPages > 1)&&(
              <SDPagination page={data?.page} action={setPage} size="sm"/>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function TicketRow({ ticket }: { ticket: TicketListItem }) {
  const statusConfig = ticketStatusConfig[ticket.status] || {
    label: ticket.status,
    color: "gray",
  };
  const priorityConfig = ticketPriorityConfig[ticket.priority] || {
    label: ticket.priority,
    color: "gray",
  };

  return (
    <Link href={`/dashboard/tickets/${ticket.id}`}>
      <Box
        p={3}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border.default"
        bg="bg.subtle"
        _hover={{ bg: "bg.muted", cursor: "pointer" }}
        transition="background 0.15s"
      >
        <Flex justify="space-between" align="flex-start" gap={3}>
          <Box flex={1} minW={0}>
            <Text fontWeight="medium" fontSize="sm" truncate>
              #{ticket.id}: {ticket.title}
            </Text>
            <HStack gap={2} mt={1}>
              <Badge colorPalette={statusConfig.color} size="sm">
                {statusConfig.label}
              </Badge>
              <Badge colorPalette={priorityConfig.color} size="sm">
                {priorityConfig.label}
              </Badge>
            </HStack>
          </Box>
          <Text fontSize="xs" color="fg.muted" flexShrink={0}>
            {new Date(ticket.createdAt).toLocaleDateString("ru-RU")}
          </Text>
        </Flex>
      </Box>
    </Link>
  );
}
