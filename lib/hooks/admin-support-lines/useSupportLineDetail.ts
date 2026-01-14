import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportLineApi, type AssignmentMode } from "@/lib/api/supportLines";
import { adminApi } from "@/lib/api/admin";
import { toast } from "@/lib/utils";

/**
 * Hook for managing the detail and editing of a specific support line.
 */
export function useSupportLineDetail(lineId: number) {
  const queryClient = useQueryClient();

  // Form state
  const [description, setDescription] = useState("");
  const [slaMinutes, setSlaMinutes] = useState(60);
  const [assignmentMode, setAssignmentMode] =
    useState<AssignmentMode>("FIRST_AVAILABLE");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Specialist selection state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // --- Queries ---

  const { data: line, isLoading } = useQuery({
    queryKey: ["support-line", lineId],
    queryFn: () => supportLineApi.get(lineId),
    staleTime: 30 * 1000,
  });

  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users-by-role", selectedRole],
    queryFn: () => adminApi.getUsersByRole(selectedRole!),
    enabled: !!selectedRole,
    staleTime: 60 * 1000,
  });

  // Sync form state when data is loaded (initial sync)
  useEffect(() => {
    if (line && !isInitialized) {
      setDescription(line.description || "");
      setSlaMinutes(line.slaMinutes);
      setAssignmentMode(line.assignmentMode);
      setDisplayOrder(line.displayOrder);
      setIsInitialized(true);
    }
  }, [line, isInitialized]);

  // Reset initialization when lineId changes
  useEffect(() => {
    setIsInitialized(false);
    setIsFormDirty(false);
  }, [lineId]);

  // --- Mutations ---

  const updateMutation = useMutation({
    mutationFn: () =>
      supportLineApi.update(lineId, {
        description,
        slaMinutes,
        assignmentMode,
        displayOrder,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Линия обновлена");
      setIsFormDirty(false);
      // Force re-sync with fresh data from server
      setIsInitialized(false);
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось обновить линию");
    },
  });

  const addSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
      supportLineApi.addSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Специалист добавлен");
      setSelectedUserId(null);
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось добавить специалиста");
    },
  });

  const removeSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
      supportLineApi.removeSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Специалист удален");
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось удалить специалиста");
    },
  });

  // --- Derived State ---

  const availableSpecialists =
    availableUsers?.content.filter(
      (u) => u.active && !line?.specialists.some((s) => s.id === u.id)
    ) || [];

  const handleFieldChange = useCallback(
    (setter: (val: any) => void, val: any) => {
      setter(val);
      setIsFormDirty(true);
    },
    []
  );

  return {
    // Data
    line,
    isLoading,
    availableSpecialists,
    isLoadingUsers,

    // Form State
    form: {
      description,
      slaMinutes,
      assignmentMode,
      displayOrder,
      isDirty: isFormDirty,
      setDescription: (val: string) => handleFieldChange(setDescription, val),
      setSlaMinutes: (val: number) => handleFieldChange(setSlaMinutes, val),
      setAssignmentMode: (val: AssignmentMode) =>
        handleFieldChange(setAssignmentMode, val),
      setDisplayOrder: (val: number) => handleFieldChange(setDisplayOrder, val),
    },

    // Selection State
    selection: {
      selectedRole,
      setSelectedRole: (role: string | null) => {
        setSelectedRole(role);
        setSelectedUserId(null);
      },
      selectedUserId,
      setSelectedUserId,
    },

    // Actions
    updateLine: () => updateMutation.mutate(),
    addSpecialist: (userId: number) => addSpecialistMutation.mutate(userId),
    removeSpecialist: (userId: number) =>
      removeSpecialistMutation.mutate(userId),

    // Loading States
    isUpdating: updateMutation.isPending,
    isAddingSpecialist: addSpecialistMutation.isPending,
    isRemovingSpecialist: removeSpecialistMutation.isPending,
  };
}
