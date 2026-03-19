/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect, useRef} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useWebSocket} from "@/lib/providers/WebSocketProvider";
import {useAuthStore} from "@/stores";
import {queryKeys} from "@/lib/queryKeys";
import type {UserStatusWS} from "@/types/websocket";

/**
 * Hook for handling real-time user status updates via WebSocket
 */
export function useStatusWebSocket() {
    const {user} = useAuthStore();
    const queryClient = useQueryClient();
    const {isConnected, subscribeToUserStatus } =
        useWebSocket();

    const prevConnectedRef = useRef<boolean>(false);

    // On reconnect — refetch status from REST so we don't blindly trust stale WS state
    useEffect(() => {
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = isConnected;

        if (isConnected && !wasConnected && user?.specialist) {
            queryClient.invalidateQueries({queryKey: queryKeys.users.myStatus()});
        }
    }, [isConnected, user, queryClient]);

    // Subscribe to own status updates
    useEffect(() => {
        if (!isConnected || !user) return;

        return subscribeToUserStatus(
            user.id,
            (payload: UserStatusWS) => {

                // Update the cache for myStatus
                queryClient.setQueryData(queryKeys.users.myStatus(), (oldData: any) => {
                    if (!oldData) {
                        return {userId: payload.userId, status: payload.status, updatedAt: new Date().toISOString()};
                    }
                    return {
                        ...oldData,
                        status: payload.status,
                        updatedAt: new Date().toISOString(),
                    };
                });
            },
        );
    }, [isConnected, user, subscribeToUserStatus, queryClient]);
}
