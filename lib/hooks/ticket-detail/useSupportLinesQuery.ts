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
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();

  // Try available-lines first (role-based filtering)
  const availableLinesQuery = useQuery({
    queryKey: [...queryKeys.supportLines.list(), "available-for-forwarding"],
    queryFn: () => assignmentApi.getAvailableForwardingLines(),
    staleTime: 5 * 60 * 1000,
    enabled: !!ticket,
  });

  // Fallback to all lines (for admin or if available-lines returns empty)
  const allLinesQuery = useQuery({
    queryKey: queryKeys.supportLines.list(),
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000,
    // Only run if available-lines returned empty or we're admin
    enabled: !!ticket && (isAdmin || (availableLinesQuery.isSuccess && availableLinesQuery.data?.length === 0)),
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
  const isOnLastLine = (() => {
    if (!ticket?.supportLine || supportLines.length === 0) return false;
    if (isAdmin) return false; // Admin can always escalate

    const ticketLineName = ticket.supportLine.name?.toLowerCase() || "";
    const isDeveloperLine =
      ticketLineName.includes("developer") ||
      ticketLineName.includes("разработ") ||
      ticketLineName.includes("3 линия") ||
      ticketLineName.includes("третья");

    if (isDeveloperLine) return true;

    const maxDisplayOrder = Math.max(
      ...supportLines.map((l: SupportLine) => l.displayOrder || 0)
    );
    const ticketLineOrder = ticket.supportLine.displayOrder || 0;
    return ticketLineOrder > 0 && ticketLineOrder >= maxDisplayOrder;
  })();

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

