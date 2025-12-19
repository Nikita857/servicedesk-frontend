import { useState, useEffect, useCallback } from "react";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi } from "@/lib/api/assignments";
import { useAuthStore } from "@/stores";

interface UseTicketsCountsReturn {
  pendingCount: number;
  assignedToMeCount: number;
  unprocessedCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useTicketsCounts(): UseTicketsCountsReturn {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const username = user?.username;

  const [pendingCount, setPendingCount] = useState(0);
  const [assignedToMeCount, setAssignedToMeCount] = useState(0);
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    if (!isSpecialist) return;

    setIsLoading(true);
    try {
      const all = await ticketApi.listAll();

      const assigned = all.content.filter(
        (t) => t.assignedToUsername && t.assignedToUsername === username
      ).length;

      const unprocessed = all.content.filter(
        (t) =>
          (!t.assignedToUsername || t.assignedToUsername.trim() === "") &&
          t.status === "NEW"
      ).length;

      const pending = await assignmentApi.getPendingCount();

      setAssignedToMeCount(assigned);
      setUnprocessedCount(unprocessed);
      setPendingCount(pending);
    } catch (e) {
      console.error("Ошибка вычисления счётчиков", e);
    } finally {
      setIsLoading(false);
    }
  }, [isSpecialist, username]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return {
    pendingCount,
    assignedToMeCount,
    unprocessedCount,
    isLoading,
    refresh: loadCounts,
  };
}
