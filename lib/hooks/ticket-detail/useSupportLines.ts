import { useState, useEffect, useCallback } from "react";
import { supportLineApi, SupportLine, Specialist } from "@/lib/api/supportLines";
import { useAuthStore } from "@/stores";
import type { Ticket } from "@/types/ticket";

interface UseSupportLinesOptions {
  ticket: Ticket | null;
}

interface UseSupportLinesReturn {
  supportLines: SupportLine[];
  specialists: Specialist[];
  isLoadingSpecialists: boolean;
  isOnLastLine: boolean;
  loadSpecialists: (lineId: number) => Promise<void>;
  clearSpecialists: () => void;
}

export function useSupportLines(options: UseSupportLinesOptions): UseSupportLinesReturn {
  const { ticket } = options;
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN") || false;

  const [supportLines, setSupportLines] = useState<SupportLine[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(false);
  const [isOnLastLine, setIsOnLastLine] = useState(false);

  // Load support lines and determine if on last line
  useEffect(() => {
    const loadSupportLines = async () => {
      try {
        const lines = await supportLineApi.getAll();
        setSupportLines(lines);

        // Determine if ticket is on the DEVELOPER line (last/3rd line)
        if (ticket?.supportLine && lines.length > 0) {
          const ticketLineName = ticket.supportLine.name?.toLowerCase() || "";

          // Check if current line is DEVELOPER line by name
          const isDeveloperLine =
            ticketLineName.includes("developer") ||
            ticketLineName.includes("разработ") ||
            ticketLineName.includes("3 линия") ||
            ticketLineName.includes("третья");

          // Fallback: check by displayOrder if name check doesn't match
          if (!isDeveloperLine) {
            const maxDisplayOrder = Math.max(...lines.map((l) => l.displayOrder || 0));
            const ticketLineOrder = ticket.supportLine.displayOrder || 0;
            // Only consider as last line if displayOrder is actually set and is the max
            // Admin can escalate from any line regardless
            setIsOnLastLine(
              !isAdmin && ticketLineOrder > 0 && ticketLineOrder >= maxDisplayOrder
            );
          } else {
            // Admin can escalate even from developer line
            setIsOnLastLine(!isAdmin);
          }
        }
      } catch (error) {
        console.error("Failed to load support lines", error);
      }
    };

    if (ticket) {
      loadSupportLines();
    }
  }, [ticket, isAdmin]);

  const loadSpecialists = useCallback(async (lineId: number) => {
    setIsLoadingSpecialists(true);
    setSpecialists([]);
    try {
      const specs = await supportLineApi.getSpecialists(lineId);
      setSpecialists(specs);
    } catch (error) {
      console.error("Failed to load specialists", error);
    } finally {
      setIsLoadingSpecialists(false);
    }
  }, []);

  const clearSpecialists = useCallback(() => {
    setSpecialists([]);
  }, []);

  return {
    supportLines,
    specialists,
    isLoadingSpecialists,
    isOnLastLine,
    loadSpecialists,
    clearSpecialists,
  };
}
