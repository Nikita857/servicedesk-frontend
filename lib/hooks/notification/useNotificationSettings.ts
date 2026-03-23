import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/queryKeys";
import {notificationSettingsApi} from "@/lib/api/notificationSettings";
import {NotificationSettingsBulkUpdate} from "@/types";
import {handleApiError, toast} from "@/lib/utils";

export function useNotificationSettings() {

    const queryClient = useQueryClient();

    const listSettings = useQuery({
        queryKey: queryKeys.notifications.settings(),
        queryFn: () => notificationSettingsApi.get(),
        staleTime: 5 * 60 * 1000,
    });

    const saveSettingsMutation = useMutation({
        mutationFn: (data: NotificationSettingsBulkUpdate) => notificationSettingsApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.settings()})
            toast.success("Настройки уведомлений обновлены");
        },
        onError: (error) => handleApiError(`Не удалось сохранить настройки: ${error}`),
    });

    return {listSettings, saveSettingsMutation};
}