import { adminApi, AdminUser, CreateUserParams } from "@/lib/api/admin";
import { toast } from "@/lib/utils/toast";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export const useCrudUsers = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ADMIN");

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [isEditFioOpen, setIsEditFioOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

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

  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers(
        page,
        20,
        searchQuery || undefined
      );
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Ошибка", "Не удалось загрузить пользователей");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Ошибка", "Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createUser(newUser);
      toast.success("Пользователь создан");
      setIsCreateOpen(false);
      setNewUser({
        username: "",
        password: "",
        fio: "",
        roles: ["USER"],
        active: true,
      });
      fetchUsers();
    } catch {
      toast.error("Ошибка", "Не удалось создать пользователя");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser: AdminUser) => {
    try {
      await adminApi.toggleActive(targetUser.id, !targetUser.active);
      toast.success(
        targetUser.active
          ? "Пользователь деактивирован"
          : "Пользователь активирован"
      );
      fetchUsers();
    } catch {
      toast.error("Ошибка", "Не удалось изменить статус");
    }
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await adminApi.updateRoles(selectedUser.id, editRoles);
      toast.success("Роли обновлены");
      setIsEditRolesOpen(false);
      fetchUsers();
    } catch {
      toast.error("Ошибка", "Не удалось обновить роли");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFio = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await adminApi.updateFio(selectedUser.id, editFio);
      toast.success("ФИО обновлено");
      setIsEditFioOpen(false);
      fetchUsers();
    } catch {
      toast.error("Ошибка", "Не удалось обновить ФИО");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    setIsSubmitting(true);
    try {
      await adminApi.changePassword(selectedUser.id, newPassword);
      toast.success("Пароль изменён");
      setIsChangePasswordOpen(false);
      setNewPassword("");
    } catch {
      toast.error("Ошибка", "Не удалось изменить пароль");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await adminApi.deleteUser(selectedUser.id);
      toast.success("Пользователь удалён");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch {
      toast.error("Ошибка", "Не удалось удалить пользователя");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return {
    /* ===== AUTH ===== */
    isAdmin,

    /* ===== LOADING ===== */
    isLoading,
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
      fetchUsers,
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
