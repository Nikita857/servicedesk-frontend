import { adminApi, AdminUser, CreateUserParams } from "@/lib/api/admin";
import { toast } from "@/lib/utils/toast";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys
const USERS_QUERY_KEY = "admin-users";

export const useCrudUsers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN");
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

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [newUser, setNewUser] = useState<CreateUserParams>({
    username: "",
    password: "",
    fio: "",
    roles: ["USER"],
    active: true,
  });
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editFio, setEditFio] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  // ==================== QUERY ====================

  const usersQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, page, debouncedSearchQuery],
    queryFn: () =>
      adminApi.getUsers(page, 20, debouncedSearchQuery || undefined),
    enabled: !!isAdmin,
    staleTime: 30 * 1000, // 30 seconds
  });

  const users = usersQuery.data?.content ?? [];
  const totalPages = usersQuery.data?.page?.totalPages ?? 0;
  const totalElements = usersQuery.data?.page?.totalElements ?? 0;

  // ==================== MUTATIONS ====================

  const createUserMutation = useMutation({
    mutationFn: (params: CreateUserParams) => adminApi.createUser(params),
    onSuccess: () => {
      toast.success("Пользователь создан");
      setIsCreateOpen(false);
      setNewUser({
        username: "",
        password: "",
        fio: "",
        roles: ["USER"],
        active: true,
      });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось создать пользователя");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.toggleActive(id, active),
    onSuccess: (_, variables) => {
      toast.success(
        variables.active
          ? "Пользователь активирован"
          : "Пользователь деактивирован"
      );
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось изменить статус");
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
    onError: () => {
      toast.error("Ошибка", "Не удалось обновить роли");
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
    onError: () => {
      toast.error("Ошибка", "Не удалось обновить ФИО");
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
    onError: () => {
      toast.error("Ошибка", "Не удалось изменить пароль");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Пользователь удалён");
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось удалить пользователя");
    },
  });

  // ==================== HANDLERS ====================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    // Query will automatically refetch due to searchQuery change
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Ошибка", "Заполните обязательные поля");
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleToggleActive = (targetUser: AdminUser) => {
    toggleActiveMutation.mutate({
      id: targetUser.id,
      active: !targetUser.active,
    });
  };

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

  // ==================== DIALOG OPENERS ====================

  const openEditRoles = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setEditRoles([...targetUser.roles]);
    setIsEditRolesOpen(true);
  };

  const openEditFio = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setEditFio(targetUser.fio || "");
    setIsEditFioOpen(true);
  };

  const openChangePassword = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setNewPassword("");
    setIsChangePasswordOpen(true);
  };

  const openDelete = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setIsDeleteOpen(true);
  };

  // ==================== UTILS ====================

  const toggleRole = (
    role: string,
    roles: string[],
    setRoles: (r: string[]) => void
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
    deleteUserMutation.isPending;

  return {
    /* ===== AUTH ===== */
    isAdmin,

    /* ===== LOADING ===== */
    isLoading: usersQuery.isLoading,
    isSubmitting,

    /* ===== PAGINATION / SEARCH ===== */
    pageable: {
      page,
      setPage,
      searchQuery,
      setSearchQuery,
      totalPages,
      totalElements,
    },

    /* ===== DATA ===== */
    users,
    selectedUser,

    /* ===== FORMS ===== */
    forms: {
      newUser,
      setNewUser,
      editRoles,
      setEditRoles,
      editFio,
      setEditFio,
      newPassword,
      setNewPassword,
    },

    /* ===== DIALOG STATES ===== */
    dialogState: {
      isCreateOpen,
      isEditRolesOpen,
      isEditFioOpen,
      isChangePasswordOpen,
      isDeleteOpen,
    },

    dialog: {
      openCreate: () => setIsCreateOpen(true),
      closeCreate: () => setIsCreateOpen(false),

      openEditRoles,
      openEditFio,
      openChangePassword,
      openDelete,

      closeEditRoles: () => setIsEditRolesOpen(false),
      closeEditFio: () => setIsEditFioOpen(false),
      closeChangePassword: () => setIsChangePasswordOpen(false),
      closeDelete: () => setIsDeleteOpen(false),
    },

    actions: {
      handleSearch,
      handleCreateUser,
      handleToggleActive,
      handleUpdateRoles,
      handleUpdateFio,
      handleChangePassword,
      handleDeleteUser,
    },

    utils: {
      toggleRole,
    },
  };
};
