import { useWebSocket } from "@/lib/providers";
import { queryKeys } from "@/lib/queryKeys";
import { useTicketListSubscription } from "./useTicketListSubscription";

interface UseTicketsWebSocketOptions {
  enabled?: boolean;
}

export function useTicketsWebSocket(options: UseTicketsWebSocketOptions = {}) {
  const { enabled = true } = options;
  const { isConnected } = useWebSocket();

  useTicketListSubscription({
    queryKey: queryKeys.tickets.lists(),
    enabled,
  });

  return { isConnected };
}
