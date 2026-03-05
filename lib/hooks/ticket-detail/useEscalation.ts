import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { assignmentApi } from "@/lib/api/assignments";
import type { AssignmentResponse } from "@/types/assignment";
import { ticketApi } from "@/lib/api/tickets";
import { toast, handleApiError } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";
import type { Ticket } from "@/types/ticket";

interface UseEscalationOptions {
  ticket: Ticket | null;
  onSuccess?: (ticket: Ticket, assignment: AssignmentResponse) => void;
}

interface UseEscalationReturn {
  showEscalation: boolean;
  setShowEscalation: (show: boolean) => void;
  selectedLineId: number | undefined;
  setSelectedLineId: (id: number | undefined) => void;
  selectedSpecialistId: number | undefined;
  setSelectedSpecialistId: (id: number | undefined) => void;
  escalationComment: string;
  setEscalationComment: (comment: string) => void;
  isEscalating: boolean;
  handleEscalate: () => Promise<void>;
  resetForm: () => void;
}

export function useEscalation(options: UseEscalationOptions): UseEscalationReturn {
  const { ticket, onSuccess } = options;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showEscalation, setShowEscalation] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number | undefined>();
  const [escalationComment, setEscalationComment] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);

  const resetForm = useCallback(() => {
    setShowEscalation(false);
    setSelectedLineId(undefined);
    setSelectedSpecialistId(undefined);
    setEscalationComment("");
  }, []);

  const handleEscalate = useCallback(async () => {
    if (!ticket || !selectedLineId || !escalationComment.trim()) {
      toast.error("Ошибка", "Выберите линию поддержки и укажите комментарий");
      return;
    }

    setIsEscalating(true);
    try {
      // Create assignment
      const assignment = await assignmentApi.create({
        ticketId: ticket.id,
        toLineId: selectedLineId,
        toUserId: selectedSpecialistId,
        fromLineId: ticket.supportLine?.id ?? null,
        fromUserId: user?.id ?? null,
        note: escalationComment,
        mode: selectedSpecialistId ? "DIRECT" : "FIRST_AVAILABLE",
      });

      toast.success(
        "Заявка переадресована",
        selectedSpecialistId
          ? "Заявка назначена на специалиста"
          : "Заявка передана на линию поддержки"
      );

      // Инвалидируем глобальный кэш тикетов (дашборд, плитки)
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });

      // Refresh ticket data
      const updatedTicket = await ticketApi.get(ticket.id);
      onSuccess?.(updatedTicket, assignment);

      // Reset form
      resetForm();
    } catch (error) {
      handleApiError(error, { context: "переадресовать тикет" });
    } finally {
      setIsEscalating(false);
    }
  }, [ticket, selectedLineId, selectedSpecialistId, escalationComment, user, onSuccess, resetForm]);

  return {
    showEscalation,
    setShowEscalation,
    selectedLineId,
    setSelectedLineId,
    selectedSpecialistId,
    setSelectedSpecialistId,
    escalationComment,
    setEscalationComment,
    isEscalating,
    handleEscalate,
    resetForm,
  };
}
