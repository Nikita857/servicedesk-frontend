import { useCallback } from "react";
import { assignmentApi } from "@/lib/api/assignments";
import { toast } from "@/lib/utils";

interface UseAssignmentsActionsReturn {
  handleAccept: (id: number) => Promise<boolean>;
  handleReject: (id: number, reason?: string) => Promise<boolean>;
}

interface UseAssignmentsActionsOptions {
  onSuccess?: () => void;
}

export function useAssignmentsActions(
  options?: UseAssignmentsActionsOptions
): UseAssignmentsActionsReturn {
  const { onSuccess } = options || {};

  const handleAccept = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await assignmentApi.accept(id);
        toast.success("Назначение принято");
        onSuccess?.();
        return true;
      } catch {
        toast.error("Ошибка", "Не удалось принять назначение");
        return false;
      }
    },
    [onSuccess]
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
