import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "@/lib/api/maintenance";
import { queryKeys } from "@/lib/queryKeys";
import { handleApiError, toast } from "@/lib/utils";
import type { UpdateMaintenanceRequest } from "@/types/maintenance";

export function useMaintenanceSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.maintenance.settings(),
    queryFn: () => maintenanceApi.getSettings(),
    staleTime: 30 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaintenanceRequest) => maintenanceApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.maintenance.settings(),
      });
      // Инвалидируем публичный статус — гейт подхватит изменение на следующем поллинге.
      queryClient.invalidateQueries({
        queryKey: queryKeys.maintenance.status(),
      });
      toast.success("Настройки режима обслуживания сохранены");
    },
    onError: (error) => handleApiError(error),
  });

  return {
    settings,
    isLoading,
    updateSettings: (data: UpdateMaintenanceRequest) =>
      updateMutation.mutate(data),
    isUpdating: updateMutation.isPending,
  };
}
