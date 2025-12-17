import { useState, useCallback } from "react";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { ticketApi } from "@/lib/api/tickets";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import axios from "axios";
import type { Ticket } from "@/types/ticket";

interface UseEscalationOptions {
  ticket: Ticket | null;
  onSuccess?: (ticket: Ticket, assignment: Assignment) => void;
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
      toaster.error({
        title: "Ошибка",
        description: "Выберите линию поддержки и укажите комментарий",
        closable: true,
      });
      return;
    }

    setIsEscalating(true);
    try {
      // Create assignment
      const assignment = await assignmentApi.create({
        ticketId: ticket.id,
        toLineId: selectedLineId,
        toUserId: selectedSpecialistId,
        fromLineId: ticket.supportLine?.id,
        fromUserId: user?.id,
        note: escalationComment,
        mode: selectedSpecialistId ? "DIRECT" : "FIRST_AVAILABLE",
      });

      toaster.success({
        title: "Тикет переадресован",
        description: selectedSpecialistId
          ? "Тикет назначен на специалиста"
          : "Тикет передан на линию поддержки",
        closable: true,
      });

      // Refresh ticket data
      const updatedTicket = await ticketApi.get(ticket.id);
      onSuccess?.(updatedTicket, assignment);

      // Reset form
      resetForm();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toaster.error({
          title: "Ошибка",
          description: `Не удалось переадресовать тикет. ${error.response.data.message}`,
          closable: true,
        });
      } else {
        console.error(error);
        toaster.error({
          title: "Ошибка",
          description: "Неизвестная ошибка",
          closable: true,
        });
      }
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
