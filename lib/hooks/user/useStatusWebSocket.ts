/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect, useRef} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useWebSocket} from "@/lib/providers/WebSocketProvider";
import {useAuthStore} from "@/stores";
import {queryKeys} from "@/lib/queryKeys";
import type {UserStatusWS} from "@/types/websocket";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";

/**
 * Hook for handling real-time user status updates via WebSocket
 */
export function useStatusWebSocket() {
    const {user} = useAuthStore();
    const queryClient = useQueryClient();
    const {isConnected, subscribeToUserStatus } =
        useWebSocket();
    const { hasAny } = useCurrentPermissions();
    const hasActivityStatus = hasAny([PERM.TICKET_READ_LINE, PERM.TICKET_READ_ALL]);

    const prevConnectedRef = useRef<boolean>(false);

    // On reconnect — refetch status from REST so we don't blindly trust stale WS state
    useEffect(() => {
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = isConnected;

        if (isConnected && !wasConnected && hasActivityStatus) {
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
