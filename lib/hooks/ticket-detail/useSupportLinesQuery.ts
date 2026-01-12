import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supportLineApi, assignmentApi, SupportLine, Specialist } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores";
import type { Ticket } from "@/types/ticket";

interface UseSupportLinesQueryOptions {
  ticket: Ticket | null;
}

interface UseSupportLinesQueryReturn {
  supportLines: SupportLine[];
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
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || false;
  const isSpecialist = user?.specialist || false;
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();

  // Try available-lines first (role-based filtering) - ONLY for specialists
  const availableLinesQuery = useQuery({
    queryKey: [...queryKeys.supportLines.list(), "available-for-forwarding"],
    queryFn: () => assignmentApi.getAvailableForwardingLines(),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticket && isSpecialist,
  });

  // Fallback to all lines (for admin or if available-lines returns empty)
  // Also only relevant if user is specialist/admin, regular users don't see escalation panel
  const allLinesQuery = useQuery({
    queryKey: queryKeys.supportLines.list(),
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
    // Only run if available-lines returned empty or we're admin
    enabled: !!ticket && isSpecialist && (isAdmin || (availableLinesQuery.isSuccess && availableLinesQuery.data?.length === 0)),
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
    staleTime: 1 * 60 * 1000, // 1 minutes
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

