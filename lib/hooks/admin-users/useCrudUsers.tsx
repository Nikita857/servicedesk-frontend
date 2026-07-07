import { adminApi } from "@/lib/api/admin";
import type { AdminUserResponse, CreateUserRequest } from "@/types/admin";
import { handleApiError, toast } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys
const USERS_QUERY_KEY = "admin-users";

export const useCrudUsers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { has } = useCurrentPermissions();
  const canManageUsers = has(PERM.USER_MANAGE);
  const router = useRouter();

  // Pagination & search state
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [isEditFioOpen, setIsEditFioOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isEditSpecialistTypeOpen, setIsEditSpecialistTypeOpen] = useState(false);

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);

  // Form states
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editFio, setEditFio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);
  const [editPositionId, setEditPositionId] = useState<number | null>(null);

  // Redirect if no user management permission
  useEffect(() => {
    if (user && !canManageUsers) {
      router.push("/dashboard");
    }
  }, [user, canManageUsers, router]);

  // ==================== QUERY ====================

  const usersQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, page, debouncedSearchQuery],
    queryFn: () =>
      adminApi.getUsers(page, 20, debouncedSearchQuery || undefined),
    enabled: canManageUsers,
    staleTime: 30 * 1000, // 30 seconds
  });

  const users = usersQuery.data?.content ?? [];
  const pageInfo = usersQuery.data?.page;
  const totalElements = pageInfo?.totalElements ?? 0;

  // ==================== MUTATIONS ====================

  const createUserMutation = useMutation({
    mutationFn: (params: CreateUserRequest) => adminApi.createUser(params),
    onSuccess: () => {
      toast.success("Пользователь создан");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "создать пользователя" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.toggleActive(id, active),
    onSuccess: (_, variables) => {
      toast.success(
        variables.active
          ? "Пользователь активирован"
          : "Пользователь деактивирован",
      );
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "изменить статус" });
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      adminApi.updateRoles(id, roles),
    onSuccess: () => {
      toast.success("Роли обновлены");
      setIsEditRolesOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить роли" });
    },
  });

  const updateFioMutation = useMutation({
    mutationFn: ({ id, fio }: { id: number; fio: string }) =>
      adminApi.updateFio(id, fio),
    onSuccess: () => {
      toast.success("ФИО обновлено");
      setIsEditFioOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить ФИО" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      adminApi.changePassword(id, password),
    onSuccess: () => {
      toast.success("Пароль изменён");
      setIsChangePasswordOpen(false);
      setNewPassword("");
    },
    onError: (error) => {
      handleApiError(error, { context: "изменить пароль" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Пользователь удалён");
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "удалить пользователя" });
    },
  });

  const updateSpecialistTypeMutation = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string | null }) =>
      adminApi.updateSpecialistType(id, code),
    onSuccess: () => {
      toast.success("Тип специалиста обновлён");
      setIsEditSpecialistTypeOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить тип специалиста" });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({
      id,
      departmentId,
      positionId,
    }: {
      id: number;
      departmentId: number | null;
      positionId: number | null;
    }) => adminApi.updateDepartmentAndPosition(id, departmentId, positionId),
    onSuccess: () => {
      toast.success("Данные организации обновлены");
      setIsEditOrgOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      handleApiError(error, { context: "обновить данные организации" });
    },
  });

  // ==================== HANDLERS ====================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    // Query will automatically refetch due to searchQuery change
  };

  const handleCreateUser = async (params: CreateUserRequest) => {
    createUserMutation.mutate(params);
  };

  const handleToggleActive = useCallback(
    (targetUser: AdminUserResponse) => {
      toggleActiveMutation.mutate({
        id: targetUser.id,
        active: !targetUser.active,
      });
    },
    [toggleActiveMutation],
  );

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    updateRolesMutation.mutate({ id: selectedUser.id, roles: editRoles });
  };

  const handleUpdateFio = async () => {
    if (!selectedUser) return;
    updateFioMutation.mutate({ id: selectedUser.id, fio: editFio });
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    changePasswordMutation.mutate({
      id: selectedUser.id,
      password: newPassword,
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const handleUpdateSpecialistType = async (code: string | null) => {
    if (!selectedUser) return;
    updateSpecialistTypeMutation.mutate({ id: selectedUser.id, code });
  };

  const handleUpdateOrg = async () => {
    if (!selectedUser) return;
    updateOrgMutation.mutate({
      id: selectedUser.id,
      departmentId: editDepartmentId,
      positionId: editPositionId,
    });
  };

  // ==================== DIALOG OPENERS ====================

  const openEditRoles = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    setEditRoles(targetUser.roles.map((r) => (r.startsWith("ROLE_") ? r : `ROLE_${r}`)));
    setIsEditRolesOpen(true);
  }, []);

  const openEditFio = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    setEditFio(targetUser.fio || "");
    setIsEditFioOpen(true);
  }, []);

  const openChangePassword = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    setNewPassword("");
    setIsChangePasswordOpen(true);
  }, []);

  const openDelete = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    setIsDeleteOpen(true);
  }, []);

  const openEditSpecialistType = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    setIsEditSpecialistTypeOpen(true);
  }, []);

  const openEditOrg = useCallback((targetUser: AdminUserResponse) => {
    setSelectedUser(targetUser);
    // These might need to be resolved from names if the API doesn't return IDs in the user object
    // But AdminUserResponse should have departmentId/positionId if the API provides it.
    // Looking at AdminUserResponse type in admin.ts - it only has departmentName/positionName.
    // I might need to fetch the full user to get IDs if needed, or matched by name.
    // According to OpenAPI, UserAuthResponse has departmentName and positionName.
    // So I might need to initialize them as null and let the user re-select, or find IDs by name.
    setEditDepartmentId(null);
    setEditPositionId(null);
    setIsEditOrgOpen(true);
  }, []);

  // ==================== UTILS ====================

  const toggleRole = (
    role: string,
    roles: string[],
    setRoles: (r: string[]) => void,
  ) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  // ==================== COMPUTED ====================

  const isSubmitting =
    createUserMutation.isPending ||
    toggleActiveMutation.isPending ||
    updateRolesMutation.isPending ||
    updateFioMutation.isPending ||
    changePasswordMutation.isPending ||
    deleteUserMutation.isPending ||
    updateOrgMutation.isPending ||
    updateSpecialistTypeMutation.isPending;

  return {
    /* ===== AUTH ===== */
    isAdmin: canManageUsers,

    /* ===== LOADING ===== */
    isLoading: usersQuery.isLoading,
    isSubmitting,

    /* ===== PAGINATION / SEARCH ===== */
    pageable: {
      setPage,
      searchQuery,
      setSearchQuery,
      pageInfo,
      totalElements,
    },

    /* ===== DATA ===== */
    users,
    selectedUser,

    /* ===== FORMS ===== */
    forms: {
      editRoles,
      setEditRoles,
      editFio,
      setEditFio,
      newPassword,
      setNewPassword,
      editDepartmentId,
      setEditDepartmentId,
      editPositionId,
      setEditPositionId,
    },

    /* ===== DIALOG STATES ===== */
    dialogState: {
      isCreateOpen,
      isEditRolesOpen,
      isEditFioOpen,
      isChangePasswordOpen,
      isDeleteOpen,
      isEditOrgOpen,
      isEditSpecialistTypeOpen,
    },

    dialog: {
      openCreate: () => setIsCreateOpen(true),
      closeCreate: () => setIsCreateOpen(false),

      openEditRoles,
      openEditFio,
      openChangePassword,
      openDelete,
      openEditOrg,
      openEditSpecialistType,

      closeEditRoles: () => setIsEditRolesOpen(false),
      closeEditFio: () => setIsEditFioOpen(false),
      closeChangePassword: () => setIsChangePasswordOpen(false),
      closeDelete: () => setIsDeleteOpen(false),
      closeEditOrg: () => setIsEditOrgOpen(false),
      closeEditSpecialistType: () => setIsEditSpecialistTypeOpen(false),
    },

    actions: {
      handleSearch,
      handleCreateUser,
      handleToggleActive,
      handleUpdateRoles,
      handleUpdateFio,
      handleChangePassword,
      handleDeleteUser,
      handleUpdateOrg,
      handleUpdateSpecialistType,
    },

    utils: {
      toggleRole,
    },
  };
};
