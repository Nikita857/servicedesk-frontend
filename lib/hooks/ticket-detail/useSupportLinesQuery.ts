import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supportLineApi, SupportLine, Specialist } from "@/lib/api/supportLines";
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

  // Support lines query
  const linesQuery = useQuery({
    queryKey: queryKeys.supportLines.list(),
    queryFn: () => supportLineApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - rarely changes
    enabled: !!ticket,
  });

  // Specialists query - only when line is selected
  const specialistsQuery = useQuery({
    queryKey: queryKeys.supportLines.specialists(selectedLineId ?? 0),
    queryFn: () => supportLineApi.getSpecialists(selectedLineId!),
    enabled: !!selectedLineId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Determine if ticket is on last line
  const isOnLastLine = (() => {
    if (!ticket?.supportLine || !linesQuery.data?.length) return false;
    if (isAdmin) return false; // Admin can always escalate

    const ticketLineName = ticket.supportLine.name?.toLowerCase() || "";
    const isDeveloperLine =
      ticketLineName.includes("developer") ||
      ticketLineName.includes("разработ") ||
      ticketLineName.includes("3 линия") ||
      ticketLineName.includes("третья");

    if (isDeveloperLine) return true;

    const maxDisplayOrder = Math.max(
      ...linesQuery.data.map((l) => l.displayOrder || 0)
    );
    const ticketLineOrder = ticket.supportLine.displayOrder || 0;
    return ticketLineOrder > 0 && ticketLineOrder >= maxDisplayOrder;
  })();

  const handleSetSelectedLineId = useCallback((id: number | undefined) => {
    setSelectedLineId(id);
  }, []);

  return {
    supportLines: linesQuery.data ?? [],
    specialists: specialistsQuery.data ?? [],
    isLoadingLines: linesQuery.isLoading,
    isLoadingSpecialists: specialistsQuery.isLoading,
    isOnLastLine,
    selectedLineId,
    setSelectedLineId: handleSetSelectedLineId,
  };
}
