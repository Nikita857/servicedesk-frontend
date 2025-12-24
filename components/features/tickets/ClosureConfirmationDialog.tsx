"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  Textarea,
  VStack,
  HStack,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { LuCheck, LuRotateCcw, LuCircleAlert } from "react-icons/lu";
import { ticketApi } from "@/lib/api/tickets";
import { toaster } from "@/components/ui/toaster";
import type { Ticket } from "@/types/ticket";
import { useAuthStore } from "@/stores";
import { RatingToast } from "./RatingToast";

interface ClosureConfirmationDialogProps {
  ticket: Ticket;
  onTicketUpdate: (ticket: Ticket) => void;
}

/**
 * Диалог подтверждения закрытия тикета для автора
 * Показывается когда тикет в статусе PENDING_CLOSURE
 */
export function ClosureConfirmationDialog({
  ticket,
  onTicketUpdate,
}: ClosureConfirmationDialogProps) {
  const { user } = useAuthStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRatingToast, setShowRatingToast] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Определяем, нужно ли показывать диалог
  const isTicketCreator = user?.id === ticket.createdBy.id;
  const isPendingClosure = ticket.status === "PENDING_CLOSURE";
  const shouldShowDialog = isPendingClosure && isTicketCreator;

  // Открываем диалог автоматически при изменении статуса
  useEffect(() => {
    if (shouldShowDialog) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [shouldShowDialog]);

  // Если только рейтинг показывается (после закрытия)
  if (!shouldShowDialog && showRatingToast) {
    return (
      <RatingToast
        ticketId={ticket.id}
        onClose={() => setShowRatingToast(false)}
      />
    );
  }

  // Если не нужно показывать ничего
  if (!shouldShowDialog && !showRatingToast) {
    return null;
  }

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const updatedTicket = await ticketApi.confirmClosure(ticket.id);
      onTicketUpdate(updatedTicket);
      setIsOpen(false);
      // Показываем окно оценки после успешного закрытия
      setShowRatingToast(true);
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось закрыть тикет",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const updatedTicket = await ticketApi.rejectClosure(
        ticket.id,
        rejectReason || undefined
      );
      onTicketUpdate(updatedTicket);
      setIsOpen(false);
      setShowRejectForm(false);
      setRejectReason("");
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось переоткрыть тикет",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(e) => {
          // Не позволяем закрыть диалог без выбора действия
          if (!e.open && !isConfirming && !isRejecting) {
            // Пользователь может только подтвердить или отклонить
            // Но не закрыть диалог кликом вне его
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <HStack gap={2}>
                  <Box color="cyan.500">
                    <LuCircleAlert size={24} />
                  </Box>
                  <Dialog.Title>Подтвердите закрытие тикета</Dialog.Title>
                </HStack>
              </Dialog.Header>

              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Text color="fg.muted">
                    Специалист отметил вашу проблему как решённую. Если проблема
                    действительно решена, подтвердите закрытие. Если нет —
                    переоткройте тикет.
                  </Text>

                  {showRejectForm && (
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Опишите, почему проблема не решена (опционально)"
                      rows={3}
                    />
                  )}
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                {showRejectForm ? (
                  <HStack gap={2} w="full" justify="flex-end">
                    <Button
                      variant="ghost"
                      onClick={() => setShowRejectForm(false)}
                      disabled={isRejecting}
                    >
                      Назад
                    </Button>
                    <Button
                      colorPalette="red"
                      onClick={handleReject}
                      loading={isRejecting}
                    >
                      <LuRotateCcw />
                      Переоткрыть тикет
                    </Button>
                  </HStack>
                ) : (
                  <HStack gap={2} w="full" justify="flex-end">
                    <Button
                      variant="outline"
                      colorPalette="orange"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <LuRotateCcw />
                      Проблема не решена
                    </Button>
                    <Button
                      colorPalette="green"
                      onClick={handleConfirm}
                      loading={isConfirming}
                    >
                      <LuCheck />
                      Подтвердить закрытие
                    </Button>
                  </HStack>
                )}
              </Dialog.Footer>

              {/* Убираем CloseButton чтобы пользователь не мог закрыть диалог без выбора */}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {showRatingToast && (
        <RatingToast
          ticketId={ticket.id}
          onClose={() => setShowRatingToast(false)}
        />
      )}
    </>
  );
}
