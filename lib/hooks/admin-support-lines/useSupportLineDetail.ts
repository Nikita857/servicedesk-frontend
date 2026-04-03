import {useCallback, useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {supportLineApi} from "@/lib/api/supportLines";
import {adminApi} from "@/lib/api/admin";
import {handleApiError, toast} from "@/lib/utils";
import {AssignmentMode} from "@/types/ticket";
import {SenderType} from "@/types/auth";

/**
 * Hook for managing the detail and editing of a specific support line.
 */
export function useSupportLineDetail(lineId: number) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Form state
  const [description, setDescription] = useState("");
  const [slaMinutes, setSlaMinutes] = useState(60);
  const [assignmentMode, setAssignmentMode] =
      useState<AssignmentMode>("FIRST_AVAILABLE");
  const [role, setRole] = useState<SenderType | null>(null);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [telegramChatId, setTelegramChatId] = useState<string>("");
  const [vkChatId, setVkChatId] = useState<string>("");
  const [maxChatId, setMaxChatId] = useState<string>("");
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Specialist selection state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // --- Queries ---

  const {data: line, isLoading} = useQuery({
    queryKey: ["support-line", lineId],
    queryFn: () => supportLineApi.get(lineId),
    staleTime: 30 * 1000,
  });

  const {data: availableUsers, isLoading: isLoadingUsers} = useQuery({
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
      setRole(line.role);
      setDisplayOrder(line.displayOrder);
      setTelegramChatId(line.supportLineChatsResponse?.telegramChatId?.toString() || "");
      setVkChatId(line.supportLineChatsResponse?.vkChatId?.toString() || "");
      setMaxChatId(line.supportLineChatsResponse?.maxChatId?.toString() || "");
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
    mutationFn: async () => {
      const updated = await supportLineApi.update(lineId, {
        description,
        slaMinutes,
        assignmentMode,
        role: role ?? undefined,
        displayOrder,
      });

      await supportLineApi.updateChatIds(lineId, {
        telegramChatId: telegramChatId ? parseInt(telegramChatId) : null,
        vkChatId: vkChatId ? parseInt(vkChatId) : null,
        maxChatId: maxChatId ? parseInt(maxChatId) : null,
      });

      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({queryKey: ["support-lines"]});
      toast.success("Линия обновлена");
      setIsFormDirty(false);
      setIsInitialized(false);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const addSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
        supportLineApi.addSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({queryKey: ["support-lines"]});
      toast.success("Специалист добавлен");
      setSelectedUserId(null);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const removeSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
        supportLineApi.removeSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({queryKey: ["support-lines"]});
      toast.success("Специалист удален");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: () => supportLineApi.deleteLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["support-lines"]});
      toast.success("Линия удалена");
      router.push("/dashboard/admin/support-lines");
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  // Query all lines to get specialist IDs across all lines
  const {data: allLines} = useQuery({
    queryKey: ["support-lines"],
    queryFn: () => supportLineApi.getAll(),
    staleTime: 30 * 1000,
  });

  // --- Derived State ---

  // Collect specialist IDs from OTHER lines
  const otherLinesSpecialistIds = new Set(
      (allLines || [])
          .filter((l) => l.id !== lineId)
          .flatMap((l) => l.specialistIds || []),
  );

  const availableSpecialists =
      availableUsers?.content.filter(
          (u) =>
              u.active &&
              !line?.specialists.some((s) => s.id === u.id) &&
              !otherLinesSpecialistIds.has(u.id),
      ) || [];

  const handleFieldChange = useCallback(
      (setter: (val: any) => void, val: any) => {
        setter(val);
        setIsFormDirty(true);
      },
      [],
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
      role,
      displayOrder,
      isDirty: isFormDirty,
      setDescription: (val: string) => handleFieldChange(setDescription, val),
      setSlaMinutes: (val: number) => handleFieldChange(setSlaMinutes, val),
      setAssignmentMode: (val: AssignmentMode) =>
          handleFieldChange(setAssignmentMode, val),
      setRole: (val: SenderType | null) => handleFieldChange(setRole, val),
      setDisplayOrder: (val: number) => handleFieldChange(setDisplayOrder, val),
      telegramChatId,
      setTelegramChatId: (val: string) =>
          handleFieldChange(setTelegramChatId, val),
      vkChatId,
      setVkChatId: (val: string) => handleFieldChange(setVkChatId, val),
      maxChatId,
      setMaxChatId: (val: string) => handleFieldChange(setMaxChatId, val),
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
    deleteLine: () => deleteLineMutation.mutate(),

    // Loading States
    isUpdating: updateMutation.isPending,
    isAddingSpecialist: addSpecialistMutation.isPending,
    isRemovingSpecialist: removeSpecialistMutation.isPending,
    isDeletingLine: deleteLineMutation.isPending,
  };
}
