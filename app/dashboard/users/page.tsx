"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Spinner,
  Badge,
  Table,
  IconButton,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Switch,
  Field,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuUsers,
  LuPencil,
  LuTrash,
  LuKey,
  LuCheck,
  LuX,
  LuShield,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { useAuthStore } from "@/stores";
import {
  adminApi,
  type AdminUser,
  type CreateUserParams,
} from "@/lib/api/admin";
import { toast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";

// Available roles
const AVAILABLE_ROLES = [
  { value: "USER", label: "Пользователь", color: "gray" },
  { value: "ADMIN", label: "Администратор", color: "red" },
  { value: "SYSADMIN", label: "Системный администратор", color: "purple" },
  { value: "ONE_C_SUPPORT", label: "Поддержка 1С", color: "blue" },
  { value: "DEV1C", label: "Разработчик 1С", color: "cyan" },
  { value: "DEVELOPER", label: "Разработчик", color: "green" },
];

const getRoleBadge = (role: string) => {
  const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
  return (
    <Badge
      key={role}
      colorPalette={roleConfig?.color || "gray"}
      size="sm"
      variant="subtle"
    >
      {roleConfig?.label || role}
    </Badge>
  );
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.roles?.includes("ADMIN");

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [isEditFioOpen, setIsEditFioOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!isAdmin) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Управление пользователями
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Всего пользователей: {totalElements}
          </Text>
        </Box>

        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => setIsCreateOpen(true)}
        >
          <LuPlus />
          Новый пользователь
        </Button>
      </Flex>

      {/* Search */}
      <Box mb={6}>
        <form onSubmit={handleSearch}>
          <Flex gap={2}>
            <Input
              placeholder="Поиск по username или ФИО..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="bg.surface"
              flex={1}
            />
            <Button type="submit" variant="outline">
              <LuSearch />
              Найти
            </Button>
          </Flex>
        </form>
      </Box>

      {/* Users Table */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      ) : users.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <LuUsers size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Text color="fg.muted" mt={4}>
            {searchQuery ? "Пользователи не найдены" : "Нет пользователей"}
          </Text>
        </Box>
      ) : (
        <>
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            overflow="hidden"
          >
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Пользователь</Table.ColumnHeader>
                  <Table.ColumnHeader>Роли</Table.ColumnHeader>
                  <Table.ColumnHeader>Статус</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    Действия
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="medium">{u.fio || "—"}</Text>
                        <Text fontSize="sm" color="fg.muted">
                          @{u.username}
                        </Text>
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1} flexWrap="wrap">
                        {u.roles.map((role) => getRoleBadge(role))}
                        {u.specialist && (
                          <Badge
                            colorPalette="orange"
                            size="sm"
                            variant="outline"
                          >
                            Специалист
                          </Badge>
                        )}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack>
                        <Switch.Root
                          checked={u.active}
                          onCheckedChange={() => handleToggleActive(u)}
                          colorPalette="green"
                          size="sm"
                        >
                          <Switch.Thumb />
                        </Switch.Root>
                        <Text
                          fontSize="sm"
                          color={u.active ? "green.500" : "fg.muted"}
                        >
                          {u.active ? "Активен" : "Неактивен"}
                        </Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack gap={1} justify="flex-end">
                        <Tooltip content="Редактировать ФИО">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditFio(u)}
                            aria-label="Редактировать ФИО"
                          >
                            <LuPencil />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Управление ролями">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRoles(u)}
                            aria-label="Роли"
                          >
                            <LuShield />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Сменить пароль">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openChangePassword(u)}
                            aria-label="Сменить пароль"
                          >
                            <LuKey />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Удалить">
                          <IconButton
                            variant="ghost"
                            size="sm"
                            colorPalette="red"
                            onClick={() => openDelete(u)}
                            aria-label="Удалить"
                            disabled={u.id === user?.id}
                          >
                            <LuTrash />
                          </IconButton>
                        </Tooltip>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="center" mt={6} gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <LuChevronLeft />
                Назад
              </Button>
              <Text alignSelf="center" fontSize="sm" color="fg.muted">
                {page + 1} / {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Вперёд
                <LuChevronRight />
              </Button>
            </Flex>
          )}
        </>
      )}

      {/* Create User Dialog */}
      <DialogRoot
        open={isCreateOpen}
        onOpenChange={(e) => setIsCreateOpen(e.open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4}>
              <Field.Root>
                <Field.Label>Username *</Field.Label>
                <Input
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="username"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Пароль *</Field.Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>ФИО</Field.Label>
                <Input
                  value={newUser.fio}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fio: e.target.value })
                  }
                  placeholder="Иванов Иван Иванович"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Роли</Field.Label>
                <HStack gap={2} flexWrap="wrap">
                  {AVAILABLE_ROLES.map((role) => (
                    <Badge
                      key={role.value}
                      colorPalette={role.color}
                      variant={
                        newUser.roles?.includes(role.value)
                          ? "solid"
                          : "outline"
                      }
                      cursor="pointer"
                      onClick={() =>
                        toggleRole(role.value, newUser.roles || [], (r) =>
                          setNewUser({ ...newUser, roles: r })
                        )
                      }
                    >
                      {newUser.roles?.includes(role.value) ? (
                        <LuCheck size={12} />
                      ) : null}
                      {role.label}
                    </Badge>
                  ))}
                </HStack>
              </Field.Root>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button
              bg="gray.900"
              color="white"
              onClick={handleCreateUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Создать"}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Edit Roles Dialog */}
      <DialogRoot
        open={isEditRolesOpen}
        onOpenChange={(e) => setIsEditRolesOpen(e.open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Роли: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <HStack gap={2} flexWrap="wrap">
              {AVAILABLE_ROLES.map((role) => (
                <Badge
                  key={role.value}
                  colorPalette={role.color}
                  variant={editRoles.includes(role.value) ? "solid" : "outline"}
                  cursor="pointer"
                  p={2}
                  onClick={() =>
                    toggleRole(role.value, editRoles, setEditRoles)
                  }
                >
                  {editRoles.includes(role.value) ? (
                    <LuCheck size={12} />
                  ) : (
                    <LuX size={12} />
                  )}
                  {role.label}
                </Badge>
              ))}
            </HStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRolesOpen(false)}>
              Отмена
            </Button>
            <Button
              bg="gray.900"
              color="white"
              onClick={handleUpdateRoles}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Сохранить"}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Edit FIO Dialog */}
      <DialogRoot
        open={isEditFioOpen}
        onOpenChange={(e) => setIsEditFioOpen(e.open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ФИО: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Field.Root>
              <Field.Label>ФИО</Field.Label>
              <Input
                value={editFio}
                onChange={(e) => setEditFio(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
            </Field.Root>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFioOpen(false)}>
              Отмена
            </Button>
            <Button
              bg="gray.900"
              color="white"
              onClick={handleUpdateFio}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Сохранить"}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Change Password Dialog */}
      <DialogRoot
        open={isChangePasswordOpen}
        onOpenChange={(e) => setIsChangePasswordOpen(e.open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пароль: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Field.Root>
              <Field.Label>Новый пароль</Field.Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field.Root>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
            >
              Отмена
            </Button>
            <Button
              bg="gray.900"
              color="white"
              onClick={handleChangePassword}
              disabled={isSubmitting || !newPassword}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Изменить"}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* Delete Dialog */}
      <DialogRoot
        open={isDeleteOpen}
        onOpenChange={(e) => setIsDeleteOpen(e.open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Вы уверены, что хотите удалить пользователя{" "}
              <strong>@{selectedUser?.username}</strong>?
            </Text>
            <Text color="fg.muted" fontSize="sm" mt={2}>
              Это действие нельзя отменить.
            </Text>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              colorPalette="red"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Удалить"}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
