"use client";

import { useState } from "react";
import {
  Box,
  Text,
  Button,
  Textarea,
  VStack,
  HStack,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { LuCheck, LuX, LuArrowRight, LuUser } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { assignmentApi, type Assignment } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/utils";

interface AssignmentDecisionDialogProps {
  assignment: Assignment | null;
  onClose: () => void;
}

export function AssignmentDecisionDialog({
  assignment,
  onClose,
}: AssignmentDecisionDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  };

  const handleAccept = async () => {
    if (!assignment) return;
    setIsAccepting(true);
    try {
      await assignmentApi.accept(assignment.id);
      toast.success("Назначение принято");
      invalidateCaches();
      onClose();
      router.push(`/dashboard/tickets/${assignment.ticketId}`);
    } catch {
      toast.error("Ошибка", "Не удалось принять назначение");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!assignment) return;
    if (!rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await assignmentApi.reject(assignment.id, rejectReason.trim());
      toast.success("Назначение отклонено");
      invalidateCaches();
      handleClose();
    } catch {
      toast.error("Ошибка", "Не удалось отклонить назначение");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    setShowRejectForm(false);
    setRejectReason("");
    onClose();
  };

  return (
    <Dialog.Root
      open={!!assignment}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <Dialog.Title>Назначение на тикет</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                {assignment && (
                  <>
                    <Box
                      bg="bg.muted"
                      borderRadius="lg"
                      p={4}
                    >
                      <Text fontWeight="semibold" mb={2}>
                        #{assignment.ticketId} — {assignment.ticketTitle}
                      </Text>

                      {assignment.fromLineName && (
                        <HStack gap={1} fontSize="sm" color="fg.muted">
                          <LuArrowRight size={14} />
                          <Text>
                            С линии: {assignment.fromLineName}
                          </Text>
                        </HStack>
                      )}

                      {assignment.fromFio && (
                        <HStack gap={1} fontSize="sm" color="fg.muted" mt={1}>
                          <LuUser size={14} />
                          <Text>
                            От: {assignment.fromFio}
                          </Text>
                        </HStack>
                      )}

                      {assignment.note && (
                        <Box mt={3} pt={3} borderTopWidth="1px" borderColor="border.default">
                          <Text fontSize="sm" color="fg.muted" mb={1}>
                            Комментарий:
                          </Text>
                          <Text fontSize="sm">{assignment.note}</Text>
                        </Box>
                      )}
                    </Box>

                    {showRejectForm && (
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Укажите причину отклонения"
                        rows={3}
                      />
                    )}
                  </>
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
                    disabled={!rejectReason.trim()}
                  >
                    <LuX />
                    Отклонить
                  </Button>
                </HStack>
              ) : (
                <HStack gap={2} w="full" justify="flex-end">
                  <Button
                    variant="outline"
                    colorPalette="red"
                    onClick={() => setShowRejectForm(true)}
                  >
                    <LuX />
                    Отклонить
                  </Button>
                  <Button
                    colorPalette="green"
                    onClick={handleAccept}
                    loading={isAccepting}
                  >
                    <LuCheck />
                    Принять
                  </Button>
                </HStack>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}