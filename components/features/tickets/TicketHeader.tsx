"use client";

import React, { useState } from "react";
import { handleApiError } from "@/lib/utils";
import { ticketApi } from "@/lib/api";
import { suppressTicketToast } from "@/lib/hooks";
import {
  statusTransitions,
  specialistStatusTransitions,
  Ticket,
  ticketPriorityConfig,
  TicketStatus,
  ticketStatusConfig,
} from "@/types";
import {
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Menu,
  Portal,
  Text,
  Dialog,
  CloseButton,
  Textarea,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuChevronDown,
  LuForward,
  LuPlay,
  LuX,
} from "react-icons/lu";
import type { User } from "@/types/auth";

interface TicketHeaderProps {
  ticket: Ticket;
  setTicket: (ticket: Ticket) => void;
  isSpecialist: boolean;
  canEscalate: boolean;
  showEscalation: boolean;
  setShowEscalation: (isSet: boolean) => void;
  isOnLastLine: boolean;
  hasPendingAssignment?: boolean;
  user?: User | null;
}

export default function TicketHeader({
  ticket,
  setTicket,
  isSpecialist,
  canEscalate,
  showEscalation,
  setShowEscalation,
  isOnLastLine,
  hasPendingAssignment = false,
  user,
}: TicketHeaderProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const statusConf = ticketStatusConfig[ticket.status] || {
    label: ticket.status,
    color: "gray",
  };
  const priorityConf = ticketPriorityConfig[ticket.priority] || {
    label: ticket.priority,
    color: "gray",
  };

  // Can cancel: ticket creator or admin, and ticket is not closed/cancelled
  const isTicketCreator = user?.id === ticket.createdBy?.id;
  const isAdmin = user?.roles?.includes("ADMIN") || false;
  const canCancel =
    (isTicketCreator || isAdmin) &&
    ticket.status !== "CLOSED" &&
    ticket.status !== "CANCELLED";

  // Can show escalation button: not closed/resolved and no pending assignment
  const canReassign = () => {
    if (
      ticket.status === "CLOSED" ||
      ticket.status === "RESOLVED" ||
      ticket.status === "PENDING_CLOSURE"
    ) {
      return false;
    }
    // Hide if there's already a pending assignment
    if (hasPendingAssignment) {
      return false;
    }
    return true;
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    // Подавляем дублирующий toast от WebSocket
    suppressTicketToast(ticket.id);
    try {
      const updated = await ticketApi.changeStatus(ticket.id, {
        status: newStatus,
      });
      setTicket(updated);
    } catch (error) {
      handleApiError(error, { context: "изменить статус тикета" });
    }
  };

  const handleCancelTicket = async () => {
    setIsCancelling(true);
    // Подавляем дублирующий toast от WebSocket
    suppressTicketToast(ticket.id);
    try {
      const updated = await ticketApi.cancelTicket(
        ticket.id,
        cancelReason || undefined
      );
      setTicket(updated);
      setShowCancelDialog(false);
      setCancelReason("");
    } catch (error) {
      handleApiError(error, { context: "отменить тикет" });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Flex
        mb={3}
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={2}
      >
        {/* Left side: Back button, Title, Badges */}
        <HStack flex={1} minW="0" gap={3} wrap="wrap">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">
              <LuArrowLeft />
            </Button>
          </Link>

          <Heading
            size="sm"
            color="fg.default"
            wordBreak="break-word"
            flex={1}
            minW="0"
          >
            #{ticket.id}: {ticket.title}
          </Heading>

          <HStack gap={2} flexShrink={0}>
            <Badge colorPalette={statusConf.color} size="sm">
              {statusConf.label}
            </Badge>
            <Badge colorPalette={priorityConf.color} variant="subtle" size="sm">
              {priorityConf.label}
            </Badge>
          </HStack>
        </HStack>

        {/* Right side: Action buttons */}
        <HStack gap={2} wrap="wrap" justify="flex-end" flexShrink={0}>
            {/* Take Ticket button - for specialists when ticket is unassigned */}
            {isSpecialist && !ticket.assignedTo &&
              (ticket.status === "NEW" || ticket.status === "ESCALATED") &&
              !hasPendingAssignment && (
              <Button
                size="sm"
                colorPalette="green"
                onClick={async () => {
                  try {
                    const updated = await ticketApi.takeTicket(ticket.id);
                    setTicket(updated);
                  } catch (error) {
                    handleApiError(error, { context: "взять тикет в работу" });
                  }
                }}
              >
                <LuPlay />
                <Text display={{ base: "none", md: "inline" }}>
                  Взять в работу
                </Text>
              </Button>
            )}

            {/* Escalation button - only for specialists */}
            {canEscalate && canReassign() && (
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
                <Text display={{ base: "none", md: "inline" }}>
                  {isOnLastLine ? "На последней линии" : "Переадресовать"}
                </Text>
              </Button>
            )}

            {/* Status change menu - only for specialists */}
            {isSpecialist &&
              (() => {
                // Admin can use all transitions, specialists use restricted list (no CANCELLED)
                const availableTransitions = isAdmin
                  ? statusTransitions[ticket.status]
                  : specialistStatusTransitions[ticket.status];
                if (availableTransitions.length === 0) return null;

                return (
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button size="sm" variant="outline">
                        <Text display={{ base: "none", md: "inline" }}>
                          Изменить статус
                        </Text>
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
                                <Badge
                                  colorPalette={conf.color}
                                  size="sm"
                                  mr={2}
                                >
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

            {/* Cancel button - только если тикет ещё не взят в работу */}
            {canCancel && isTicketCreator && (!ticket.assignedTo || ticket.status === "NEW") && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => setShowCancelDialog(true)}
                title="Отменить заявку"
              >
                <Text display={{ base: "none", md: "inline" }}>
                  Отменить тикет
                </Text>
                <LuX />
              </Button>
            )}
        </HStack>
      </Flex>

      {/* Cancel Confirmation Dialog */}
      <Dialog.Root
        open={showCancelDialog}
        onOpenChange={(e) => setShowCancelDialog(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                {isTicketCreator && (
                  <Dialog.Title>Отменить заявку?</Dialog.Title>
                )}
              </Dialog.Header>
              <Dialog.Body>
                <Text mb={4} color="fg.muted">
                  Заявка будет отменена и закрыта. Это действие нельзя отменить.
                </Text>
                <Textarea
                  placeholder="Причина отмены (необязательно)"
                  value={cancelReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCancelReason(e.target.value)
                  }
                  rows={3}
                />
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                >
                  Отмена
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleCancelTicket}
                  loading={isCancelling}
                >
                  Отменить Заявку
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
