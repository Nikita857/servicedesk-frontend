import { useCallback } from "react";
import { assignmentApi } from "@/lib/api/assignments";
import { toast } from "@/lib/utils";

interface UseAssignmentsActionsReturn {
  handleAccept: (id: number) => Promise<boolean>;
  handleReject: (id: number, reason?: string) => Promise<boolean>;
}

interface UseAssignmentsActionsOptions {
  onSuccess?: () => void;
  onAcceptSuccess?: (ticketId: number) => void; // Called after accept with ticketId for navigation
}

export function useAssignmentsActions(
  options?: UseAssignmentsActionsOptions
): UseAssignmentsActionsReturn {
  const { onSuccess, onAcceptSuccess } = options || {};

  const handleAccept = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const assignment = await assignmentApi.accept(id);
        toast.success("Назначение принято");
        onSuccess?.();
        onAcceptSuccess?.(assignment.ticketId);
        return true;
      } catch {
        toast.error("Ошибка", "Не удалось принять назначение");
        return false;
      }
    },
    [onSuccess, onAcceptSuccess]
  );

  const handleReject = useCallback(
    async (id: number, reason?: string): Promise<boolean> => {
      const rejectReason = reason || prompt("Укажите причину отклонения:");
      if (!rejectReason) return false;

      try {
        await assignmentApi.reject(id, rejectReason);
        toast.success("Назначение отклонено");
        onSuccess?.();
        return true;
      } catch {
        toast.error("Ошибка", "Не удалось отклонить назначение");
        return false;
      }
    },
    [onSuccess]
  );

  return {
    handleAccept,
    handleReject,
  };
}
