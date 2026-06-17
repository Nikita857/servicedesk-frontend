import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supportLineApi } from "@/lib/api/supportLines";
import { assignmentApi } from "@/lib/api/assignments";
import type { SupportLineListResponse, Specialist } from "@/types/support-line";
import { queryKeys } from "@/lib/queryKeys";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import type { Ticket } from "@/types/ticket";

interface UseSupportLinesQueryOptions {
  ticket: Ticket | null;
}

interface UseSupportLinesQueryReturn {
  supportLines: SupportLineListResponse[];
  specialists: Specialist[];
  isLoadingLines: boolean;
  isLoadingSpecialists: boolean;
  isOnLastLine: boolean;
  selectedLineId: number | undefined;
  setSelectedLineId: (id: number | undefined) => void;
}

export function useSupportLinesQuery(
  options: UseSupportLinesQueryOptions
): UseSupportLinesQueryReturn {
  const { ticket } = options;
  const { hasAny } = useCurrentPermissions();
  const canForward = hasAny([PERM.TICKET_FORWARD, PERM.TICKET_FORWARD_ANY]);
  const canForwardAny = hasAny([PERM.TICKET_FORWARD_ANY, PERM.TICKET_UPDATE_ALL]);
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();

  // Try available-lines first (role-based filtering) - ONLY for specialists
  const availableLinesQuery = useQuery({
    queryKey: [...queryKeys.supportLines.list(), "available-for-forwarding"],
    queryFn: () => assignmentApi.getAvailableForwardingLines(),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticket && canForward,
  });

  // Fallback to all lines (for users who can forward to any line, or if available-lines returns empty)
  const allLinesQuery = useQuery({
    queryKey: queryKeys.supportLines.list(),
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticket && canForward && (canForwardAny || (availableLinesQuery.isSuccess && availableLinesQuery.data?.length === 0)),
  });

  // Use available lines if they exist, otherwise fall back to all lines
  const supportLines = (availableLinesQuery.data?.length ?? 0) > 0 
    ? availableLinesQuery.data ?? []
    : allLinesQuery.data ?? [];

  const isLoadingLines = availableLinesQuery.isLoading || 
    ((availableLinesQuery.data?.length ?? 0) === 0 && allLinesQuery.isLoading);

  // Specialists query - only when line is selected
  const specialistsQuery = useQuery({
    queryKey: queryKeys.supportLines.specialists(selectedLineId ?? 0),
    queryFn: () => supportLineApi.getSpecialists(selectedLineId!),
    enabled: !!selectedLineId,
    staleTime: 60 * 1000, // 1 minutes
  });

  // Determine if ticket is on last line
  const isOnLastLine = false;
    
  const handleSetSelectedLineId = useCallback((id: number | undefined) => {
    setSelectedLineId(id);
  }, []);

  return {
    supportLines,
    specialists: specialistsQuery.data ?? [],
    isLoadingLines,
    isLoadingSpecialists: specialistsQuery.isLoading,
    isOnLastLine,
    selectedLineId,
    setSelectedLineId: handleSetSelectedLineId,
  };
}

