import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { useAuthStore } from "@/stores";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/utils";
import { activityStatusConfig } from "@/types/auth";
import type { UserStatusWS } from "@/types/websocket";

/**
 * Hook for handling real-time user status updates via WebSocket
 */
export function useStatusWebSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { isConnected, subscribeToUserStatus, subscribeToLineStatus } =
    useWebSocket();

  // Get lines the user belongs to
  const { data: myLines = [] } = useQuery({
    queryKey: ["supportLines", "my"],
    queryFn: () => supportLineApi.getMyLines(),
    enabled: !!user?.specialist,
  });

  // Subscribe to own status updates
  useEffect(() => {
    if (!isConnected || !user) return;

    const unsubscribe = subscribeToUserStatus(
      user.id,
      (payload: UserStatusWS) => {
        console.log("[WS] Received own status update:", payload);

        // Update the cache for myStatus
        queryClient.setQueryData(queryKeys.users.myStatus(), (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: payload.status,
            updatedAt: new Date().toISOString(),
          };
        });
      },
    );

    return unsubscribe;
  }, [isConnected, user, subscribeToUserStatus, queryClient]);

  // Subscribe to status updates from colleague in the same lines
  useEffect(() => {
    if (!isConnected || !user || myLines.length === 0) return;

    const unsubscribes = myLines.map((line) => {
      return subscribeToLineStatus(line.id, (payload: UserStatusWS) => {
        // Skip own updates (handled by user topic)
        if (payload.userId === user.id) return;

        console.log(
          `[WS] Received status update for line ${line.id}:`,
          payload,
        );

        const statusInfo = activityStatusConfig[payload.status];
        const statusLabel = statusInfo?.label || payload.status;

        // Notify about colleague status change
        toast.warning(
          "Статус коллеги",
          `${payload.fio || payload.username} теперь ${statusLabel}`,
        );

        // Also invalidate status of this specific user if searched or viewed
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.status(payload.userId),
        });
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isConnected, user, myLines, subscribeToLineStatus, queryClient]);
}
