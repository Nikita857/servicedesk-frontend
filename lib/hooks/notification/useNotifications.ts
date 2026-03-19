"use client"

import {useWebSocket} from "@/lib/providers";
import {useAuthStore} from "@/stores";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {notificationsApi} from "@/lib/api/notifications";
import {handleApiError} from "@/lib/utils";
import {useEffect} from "react";
import {queryKeys} from "@/lib/queryKeys";

export function useNotifications(page = 0, size = 20) {

    const { subscribeToUserNotifications, isConnected } = useWebSocket();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const listQuery  = useQuery({
        queryKey: [...queryKeys.notifications.list(), page, size],
        queryFn: () => notificationsApi.list(page, size),
        staleTime: 60 * 1000,
    });
    
    const unreadCount = useQuery({
        queryKey: queryKeys.notifications.unreadCount(),
        queryFn: () => notificationsApi.getUnreadCount(),
        staleTime: 60 * 1000,
    });
    
    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => notificationsApi.markAsRead(id),
        onSuccess: () => queryClient.invalidateQueries({queryKey: queryKeys.notifications.all}),
        onError: () => {
            handleApiError("Не удалось прочитать сообщения")
        }
    });
    
    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => queryClient.invalidateQueries({queryKey: queryKeys.notifications.all}),
        onError: () => {handleApiError("Не удалось прочитать все сообщения")}
    });

    const clearAllMutation = useMutation({
        mutationFn: () => notificationsApi.clearAll(),
        onSuccess: () => queryClient.invalidateQueries({queryKey: queryKeys.notifications.all}),
        onError: () => {handleApiError("Не удалось очистить историю уведомлений")}
    });

    useEffect(() => {
        if(!user?.id || !isConnected) return;
        return subscribeToUserNotifications(user.id, () => {
            queryClient.invalidateQueries({queryKey: queryKeys.notifications.all});
        });
    }, [isConnected, queryClient, subscribeToUserNotifications, user?.id]);
    
    return {
        listQuery,
        unreadCount,
        markAsReadMutation,
        markAllAsReadMutation,
        clearAllMutation,
    }
}