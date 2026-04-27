import { useState, useEffect, startTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/lib/providers/WebSocketProvider";
import { queryKeys } from "@/lib/queryKeys";
import { userApi } from "@/lib/api/users";
import type { UserStatusWS } from "@/types/websocket";

export function useInterlocutorStatus(interlocutorId: number | undefined) {
  const { isConnected, subscribeToUserStatus } = useWebSocket();
  const [wsStatus, setWsStatus] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.users.status(interlocutorId!),
    queryFn: () => userApi.getUserStatus(interlocutorId!),
    enabled: !!interlocutorId && isConnected,
  });

  useEffect(() => {
    if (!isConnected || !interlocutorId) return;
    startTransition(() => {
      setWsStatus(null); // сбрасываем при смене собеседника или переподключении
    });
  }, [isConnected, interlocutorId]);

  useEffect(() => {
    if (!isConnected || !interlocutorId) return;
    return subscribeToUserStatus(interlocutorId, (payload: UserStatusWS) => {
      setWsStatus(payload.status);
    });
  }, [isConnected, interlocutorId, subscribeToUserStatus]);

  const currentStatus = wsStatus ?? data?.status ?? "OFFLINE";
  const isOnline = currentStatus === "AVAILABLE" || currentStatus === "BUSY";

  return { isOnline };
}
