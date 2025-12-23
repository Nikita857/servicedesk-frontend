"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { LuCheck, LuRotateCcw, LuCircleAlert } from "react-icons/lu";
import { ticketApi } from "@/lib/api/tickets";
import { toaster } from "@/components/ui/toaster";
import type { Ticket } from "@/types/ticket";
import { useAuthStore } from "@/stores";
import { RatingToast } from "./RatingToast";

interface ClosureConfirmationBannerProps {
  ticket: Ticket;
  onTicketUpdate: (ticket: Ticket) => void;
}

/**
 * Banner shown to ticket creator when ticket is in PENDING_CLOSURE status
 * Allows confirming or rejecting the closure request
 */
export function ClosureConfirmationBanner({
  ticket,
  onTicketUpdate,
}: ClosureConfirmationBannerProps) {
  const { user } = useAuthStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRatingToast, setShowRatingToast] = useState(false);

  // Only show banner for ticket creator and when status is PENDING_CLOSURE
  const isTicketCreator = user?.id === ticket.createdBy.id;
  const isPendingClosure = ticket.status === "PENDING_CLOSURE";
  const shouldShowBanner = isPendingClosure && isTicketCreator;

  // If not showing banner and no rating toast, return null
  if (!shouldShowBanner && !showRatingToast) {
    return null;
  }

  // If only rating toast is showing (after closure), render just the toast
  if (!shouldShowBanner && showRatingToast) {
    return (
      <RatingToast
        ticketId={ticket.id}
        onClose={() => setShowRatingToast(false)}
      />
    );
  }

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const updatedTicket = await ticketApi.confirmClosure(ticket.id);
      onTicketUpdate(updatedTicket);
      // WebSocket will send notification about status update
      // Show rating toast after successful closure
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
      // WebSocket will send notification about status update
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

  const bannerContent = (
    <Box
      bg="cyan.50"
      _dark={{ bg: "cyan.900/30", borderColor: "cyan.700" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="cyan.200"
      p={4}
      mb={4}
    >
      <Flex align="flex-start" gap={3}>
        <Box color="cyan.600" _dark={{ color: "cyan.400" }} mt={0.5}>
          <LuCircleAlert size={24} />
        </Box>

        <VStack align="stretch" flex={1} gap={3}>
          <Box>
            <Text
              fontWeight="semibold"
              color="cyan.800"
              _dark={{ color: "cyan.200" }}
            >
              Подтвердите закрытие тикета
            </Text>
            <Text fontSize="sm" color="cyan.700" _dark={{ color: "cyan.300" }}>
              Специалист отметил вашу проблему как решённую. Если проблема
              действительно решена, подтвердите закрытие. Если нет —
              переоткройте тикет.
            </Text>
          </Box>

          {showRejectForm ? (
            <VStack align="stretch" gap={2}>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Опишите, почему проблема не решена (опционально)"
                size="sm"
                bg="white"
                _dark={{ bg: "gray.800" }}
                rows={2}
              />
              <HStack gap={2}>
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={handleReject}
                  loading={isRejecting}
                >
                  <LuRotateCcw />
                  Переоткрыть
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectForm(false)}
                >
                  Отмена
                </Button>
              </HStack>
            </VStack>
          ) : (
            <HStack gap={2} flexWrap="wrap">
              <Button
                size="sm"
                colorPalette="green"
                onClick={handleConfirm}
                loading={isConfirming}
              >
                <LuCheck />
                Подтвердить закрытие
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorPalette="orange"
                onClick={() => setShowRejectForm(true)}
              >
                <LuRotateCcw />
                Проблема не решена
              </Button>
            </HStack>
          )}
        </VStack>
      </Flex>
    </Box>
  );

  // Wrap in fragment to render rating toast separately (fixed position)
  return (
    <>
      {bannerContent}
      {showRatingToast && (
        <RatingToast
          ticketId={ticket.id}
          onClose={() => setShowRatingToast(false)}
        />
      )}
    </>
  );
}
