"use client";

import { useState, useEffect } from "react";
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
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import Link from "next/link";
import type { TicketListItem } from "@/types/ticket";
import type { TicketPageResponse } from "@/lib/api/stats";
import { ticketStatusConfig, ticketPriorityConfig } from "@/types/ticket";

interface TicketListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: TicketPageResponse;
  onPageChange?: (page: number) => Promise<TicketPageResponse | undefined>;
}

export function TicketListModal({
  isOpen,
  onClose,
  title,
  initialData,
  onPageChange,
}: TicketListModalProps) {
  const [data, setData] = useState<TicketPageResponse | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Sync data with initialData when it changes (e.g., when clicking a different card)
  useEffect(() => {
    setData(initialData);
    setCurrentPage(0);
  }, [initialData]);

  const handlePageChange = async (newPage: number) => {
    if (!onPageChange || isLoading) return;
    setIsLoading(true);
    try {
      const result = await onPageChange(newPage);
      if (result) {
        setData(result);
        setCurrentPage(newPage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const tickets = data?.content || [];
  const totalPages = data ? Math.ceil(data.totalCount / data.size) : 0;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" borderRadius="xl" maxH="80vh">
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

            {totalPages > 1 && (
              <Dialog.Footer
                borderTopWidth="1px"
                borderColor="border.default"
                justifyContent="center"
              >
                <HStack gap={4}>
                  <IconButton
                    aria-label="Предыдущая страница"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || isLoading}
                  >
                    <LuChevronLeft />
                  </IconButton>
                  <Text fontSize="sm" color="fg.muted">
                    {currentPage + 1} / {totalPages}
                  </Text>
                  <IconButton
                    aria-label="Следующая страница"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || isLoading}
                  >
                    <LuChevronRight />
                  </IconButton>
                </HStack>
              </Dialog.Footer>
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
