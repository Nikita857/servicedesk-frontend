import { useCallback } from "react";
import { assignmentApi } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";

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
        toaster.success({ title: "Назначение принято", closable: true });
        onSuccess?.();
        return true;
      } catch {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось принять назначение",
          closable: true,
        });
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
        toaster.success({ title: "Назначение отклонено", closable: true });
        onSuccess?.();
        return true;
      } catch {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось отклонить назначение",
          closable: true,
        });
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
