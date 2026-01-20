import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userApi,
  type UserActivityStatus,
  type UserStatusResponse,
} from "@/lib/api/users";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";

interface UseUserStatusQueryReturn {
  status: UserActivityStatus | null;
  statusData: UserStatusResponse | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  updateStatus: (newStatus: UserActivityStatus) => void;
}

/**
 * Hook for managing user activity status
 * Only for specialists - regular users don't have status
 */
export function useUserStatusQuery(): UseUserStatusQueryReturn {
  const queryClient = useQueryClient();

  // Query current status
  const query = useQuery({
    queryKey: queryKeys.users.myStatus(),
    queryFn: () => userApi.getMyStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 60 * 1000, // 15 minutes background sync
    retry: 1, // Don't retry much - user may not have status
  });

  // Mutation to update status
  const mutation = useMutation({
    mutationFn: (newStatus: UserActivityStatus) =>
      userApi.updateMyStatus(newStatus),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.users.myStatus(), data);
      toast.success(
        "Статус обновлён",
        `Ваш статус: ${getStatusLabel(data.status)}`,
      );
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить статус" });
    },
  });

  return {
    status: query.data?.status ?? null,
    statusData: query.data ?? null,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    error: query.error,
    updateStatus: mutation.mutate,
  };
}

function getStatusLabel(status: UserActivityStatus): string {
  const labels: Record<UserActivityStatus, string> = {
    AVAILABLE: "Доступен",
    UNAVAILABLE: "Недоступен",
    BUSY: "Занят",
    TECHNICAL_ISSUE: "Техническая проблема",
    OFFLINE: "Оффлайн",
  };
  return labels[status] || status;
}
