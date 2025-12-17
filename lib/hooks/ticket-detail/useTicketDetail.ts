import { useState, useEffect, useCallback } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import type { Ticket } from "@/types/ticket";

interface UseTicketDetailReturn {
  ticket: Ticket | null;
  isLoading: boolean;
  currentAssignment: Assignment | null;
  assignmentHistory: Assignment[];
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  updateTicket: (ticket: Ticket) => void;
  refresh: () => Promise<void>;
}

export function useTicketDetail(ticketId: number): UseTicketDetailReturn {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const ticketData = await ticketApi.get(ticketId);
      setTicket(ticketData);

      // Load current assignment
      const current = await assignmentApi.getCurrentForTicket(ticketId);
      setCurrentAssignment(current);

      // Load assignment history
      const history = await assignmentApi.getTicketHistory(ticketId);
      setAssignmentHistory(history);
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось загрузить тикет",
        closable: true,
      });
      router.push("/dashboard/tickets");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Method for WebSocket updates (without full refetch)
  const updateTicket = useCallback((updatedTicket: Ticket) => {
    setTicket(updatedTicket);
  }, []);

  return {
    ticket,
    isLoading,
    currentAssignment,
    assignmentHistory,
    showHistory,
    setShowHistory,
    updateTicket,
    refresh: fetchData,
  };
}
