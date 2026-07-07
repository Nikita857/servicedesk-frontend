"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Portal,
  Dialog,
  IconButton,
  Table,
  Menu,
  Tabs,
  Drawer,
  Checkbox,
  Switch,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuChevronDown,
  LuTrash2,
  LuShieldCheck,
  LuPencil,
  LuShield,
} from "react-icons/lu";
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useDeleteRole,
  useUpdateRolePermissions,
} from "@/lib/hooks/rbac/userRoles";
import { useSpecialistTypes } from "@/lib/hooks/admin-specialistTypes/useSpecialistTypes";
import type {
  RoleResponse,
  PermissionResponse,
  CreateRoleRequest,
} from "@/types/rbac";
import type { SpecialistTypeResponse } from "@/types/support-line";
import type {
  CreateSpecialistTypeRequest,
  UpdateSpecialistTypeRequest,
} from "@/types/rbac";
import { ColorPicker } from "@/components/ui/ColorPicker";

// ─── Roles Tab ────────────────────────────────────────────────────────────────

const PERMISSION_CATEGORY_LABELS: Record<string, string> = {
  TICKET: "Заявки",
  WIKI: "Статьи",
  USER: "Пользователи и RBAC",
  ADMIN: "Администрирование",
};

const DEFAULT_ROLE_FORM: CreateRoleRequest = {
  code: "",
  name: "",
  description: "",
  color: "gray",
};

function RolesTab() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: allPermissions = [] } = usePermissions();

  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_ROLE_FORM);

  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<RoleResponse | null>(
    null,
  );

  const updateRolePermissions = useUpdateRolePermissions(
    permissionsRole?.id ?? 0,
  );

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const openPermissionsDrawer = (role: RoleResponse) => {
    setPermissionsRole(role);
    setSelectedCodes(new Set(role.permissions.map((p) => p.code)));
  };

  const closePermissionsDrawer = () => {
    setPermissionsRole(null);
    setSelectedCodes(new Set());
  };

  const handleCreate = () => {
    createRole.mutate(
      {
        code: createForm.code.trim(),
        name: createForm.name.trim(),
        description: createForm.description?.trim() || undefined,
        color: createForm.color ?? "gray",
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateForm(DEFAULT_ROLE_FORM);
        },
      },
    );
  };

  const handleSavePermissions = () => {
    updateRolePermissions.mutate(
      { permissionCodes: [...selectedCodes] },
      { onSuccess: closePermissionsDrawer },
    );
  };

  const togglePermission = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const permissionsByCategory = allPermissions.reduce<
    Record<string, PermissionResponse[]>
  >((acc, perm) => {
    const cat = perm.category || "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});

  return (
    <>
      {/* Header */}
      <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={3}>
        <Text color="fg.muted" fontSize="sm">
          Всего ролей: {roles.length}
        </Text>
        <Dialog.Root
          open={isCreateOpen}
          onOpenChange={(e) => setIsCreateOpen(e.open)}
          lazyMount
          unmountOnExit
        >
          <Dialog.Trigger asChild>
            <Button
              bg="gray.900"
              color="white"
              _hover={{ bg: "gray.800" }}
              size="sm"
            >
              <LuPlus />
              Создать роль
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="440px">
                <Dialog.Header>
                  <Dialog.Title>Новая роль</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <VStack gap={4} align="stretch">
                    <Box>
                      <Text fontWeight="medium" mb={2} fontSize="sm">
                        Код роли{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <Input
                        placeholder="ROLE_CUSTOM"
                        value={createForm.code}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={80}
                      />
                      <Text fontSize="xs" color="fg.muted" mt={1}>
                        Формат: ROLE_[A-Z_]+
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium" mb={2} fontSize="sm">
                        Название{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <Input
                        placeholder="Название роли"
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, name: e.target.value })
                        }
                        maxLength={150}
                      />
                    </Box>
                    <Box>
                      <Text fontWeight="medium" mb={2} fontSize="sm">
                        Описание
                      </Text>
                      <Textarea
                        placeholder="Краткое описание роли"
                        value={createForm.description ?? ""}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        maxLength={500}
                      />
                    </Box>
                    <Box>
                      <Text fontWeight="medium" mb={2} fontSize="sm">
                        Цвет
                      </Text>
                      <ColorPicker
                        value={createForm.color ?? "gray"}
                        onChange={(c) =>
                          setCreateForm({ ...createForm, color: c })
                        }
                      />
                    </Box>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Отмена</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    bg="gray.900"
                    color="white"
                    _hover={{ bg: "gray.800" }}
                    onClick={handleCreate}
                    disabled={
                      !createForm.code.trim() || !createForm.name.trim()
                    }
                    loading={createRole.isPending}
                  >
                    Создать
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Flex>

      {/* Table */}
      {rolesLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : roles.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <LuShield size={40} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Text color="fg.muted" mt={4}>
            Нет ролей
          </Text>
        </Box>
      ) : (
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
                <Table.ColumnHeader>Код</Table.ColumnHeader>
                <Table.ColumnHeader>Название</Table.ColumnHeader>
                <Table.ColumnHeader>Описание</Table.ColumnHeader>
                <Table.ColumnHeader>Права</Table.ColumnHeader>
                <Table.ColumnHeader>Тип</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Действия
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {roles.map((role) => (
                <Table.Row key={role.id}>
                  <Table.Cell>
                    <Badge
                      colorPalette={role.color}
                      variant="subtle"
                      size="sm"
                      fontFamily="mono"
                    >
                      {role.code}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="medium" fontSize="sm">
                      {role.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="fg.muted" maxW="200px" truncate>
                      {role.description || "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette="blue" variant="subtle" size="sm">
                      {role.permissions.length} из {allPermissions.length}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {role.system ? (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        Системная
                      </Badge>
                    ) : (
                      <Badge colorPalette="blue" variant="subtle" size="sm">
                        Пользовательская
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Действия"
                        >
                          <LuChevronDown />
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="180px">
                            <Menu.Item
                              value="permissions"
                              onClick={() => openPermissionsDrawer(role)}
                            >
                              <LuShieldCheck /> Права доступа
                            </Menu.Item>
                            <Menu.Separator />
                            <Menu.Item
                              value="delete"
                              color="red.500"
                              disabled={role.system}
                              onClick={() =>
                                !role.system && setDeleteTarget(role)
                              }
                            >
                              <LuTrash2 /> Удалить
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Delete dialog */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(e) => {
          if (!e.open) setDeleteTarget(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>Удалить роль?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Роль <Text as="strong">«{deleteTarget?.name}»</Text> будет
                  удалена. Пользователи потеряют эту роль.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  loading={deleteRole.isPending}
                  onClick={() => {
                    deleteRole.mutate(deleteTarget!.id, {
                      onSuccess: () => setDeleteTarget(null),
                    });
                  }}
                >
                  Удалить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Permissions Drawer */}
      <Drawer.Root
        open={!!permissionsRole}
        onOpenChange={(e) => {
          if (!e.open) closePermissionsDrawer();
        }}
        placement="end"
        size="md"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>
                  Права доступа: {permissionsRole?.name}
                </Drawer.Title>
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  Выбрано: {selectedCodes.size} из {allPermissions.length}
                </Text>
              </Drawer.Header>
              <Drawer.Body overflowY="auto">
                <VStack gap={6} align="stretch">
                  {Object.entries(permissionsByCategory).map(
                    ([category, perms]) => (
                      <Box key={category}>
                        <Text
                          fontWeight="semibold"
                          fontSize="xs"
                          color="fg.muted"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={2}
                        >
                          {PERMISSION_CATEGORY_LABELS[category] ?? category}
                        </Text>
                        <VStack gap={2} align="stretch">
                          {perms.map((perm) => (
                            <HStack
                              key={perm.code}
                              gap={3}
                              p={2}
                              borderRadius="md"
                              _hover={{ bg: "bg.subtle" }}
                              cursor="pointer"
                              onClick={() => togglePermission(perm.code)}
                            >
                              <Checkbox.Root
                                checked={selectedCodes.has(perm.code)}
                                onCheckedChange={() =>
                                  togglePermission(perm.code)
                                }
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                              </Checkbox.Root>
                              <VStack gap={0} align="start" flex={1}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  fontFamily="mono"
                                >
                                  {perm.code}
                                </Text>
                                {perm.description && (
                                  <Text fontSize="xs" color="fg.muted">
                                    {perm.description}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    ),
                  )}
                </VStack>
              </Drawer.Body>
              <Drawer.Footer>
                <Button variant="outline" onClick={closePermissionsDrawer}>
                  Отмена
                </Button>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  onClick={handleSavePermissions}
                  loading={updateRolePermissions.isPending}
                >
                  Сохранить
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}

// ─── Specialist Types Tab ─────────────────────────────────────────────────────

const DEFAULT_TYPE_FORM = {
  code: "",
  name: "",
  displayOrder: 100,
  color: "gray",
  active: true,
};
type TypeForm = typeof DEFAULT_TYPE_FORM;

function SpecialistTypesTab() {
  const {
    specialistTypes,
    isLoading,
    createSpecialistType,
    updateSpecialistType,
    deleteSpecialistType,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSpecialistTypes();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_TYPE_FORM);

  const [editTarget, setEditTarget] = useState<SpecialistTypeResponse | null>(
    null,
  );
  const [editForm, setEditForm] = useState(DEFAULT_TYPE_FORM);

  const [deleteTarget, setDeleteTarget] =
    useState<SpecialistTypeResponse | null>(null);

  const openEdit = (t: SpecialistTypeResponse) => {
    setEditTarget(t);
    setEditForm({
      code: t.code,
      name: t.name,
      displayOrder: t.displayOrder ?? 100,
      color: t.color ?? "gray",
      active: t.active,
    });
  };

  const handleCreate = () => {
    createSpecialistType({
      code: createForm.code.trim(),
      name: createForm.name.trim(),
      displayOrder: createForm.displayOrder,
      color: createForm.color ?? "gray",
    } as CreateSpecialistTypeRequest);
    setIsCreateOpen(false);
    setCreateForm(DEFAULT_TYPE_FORM);
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    updateSpecialistType(editTarget.id, {
      code: editForm.code.trim(),
      name: editForm.name.trim(),
      displayOrder: editForm.displayOrder,
      color: editForm.color ?? "gray",
      active: editForm.active,
    } as UpdateSpecialistTypeRequest);
    setEditTarget(null);
  };

  return (
    <>
      {/* Header */}
      <Flex mb={4} justify="space-between" align="center" wrap="wrap" gap={3}>
        <Text color="fg.muted" fontSize="sm">
          Всего типов: {specialistTypes.length}
        </Text>
        <Dialog.Root
          open={isCreateOpen}
          onOpenChange={(e) => setIsCreateOpen(e.open)}
          lazyMount
          unmountOnExit
        >
          <Dialog.Trigger asChild>
            <Button
              bg="gray.900"
              color="white"
              _hover={{ bg: "gray.800" }}
              size="sm"
            >
              <LuPlus />
              Создать тип
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="440px">
                <Dialog.Header>
                  <Dialog.Title>Новый тип специалиста</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <SpecialistTypeForm
                    form={createForm}
                    onChange={setCreateForm}
                  />
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Отмена</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    bg="gray.900"
                    color="white"
                    _hover={{ bg: "gray.800" }}
                    onClick={handleCreate}
                    disabled={
                      !createForm.code.trim() || !createForm.name.trim()
                    }
                    loading={isCreating}
                  >
                    Создать
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Flex>

      {/* Table */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : specialistTypes.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <Text color="fg.muted">Нет типов специалистов</Text>
        </Box>
      ) : (
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
                <Table.ColumnHeader>Код</Table.ColumnHeader>
                <Table.ColumnHeader>Название</Table.ColumnHeader>
                <Table.ColumnHeader>Порядок</Table.ColumnHeader>
                <Table.ColumnHeader>Статус</Table.ColumnHeader>
                <Table.ColumnHeader>Тип</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Действия
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {specialistTypes.map((t) => (
                <Table.Row key={t.id}>
                  <Table.Cell>
                    <Badge
                      colorPalette={t.color}
                      variant="subtle"
                      size="sm"
                      fontFamily="mono"
                    >
                      {t.code}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="medium" fontSize="sm">
                      {t.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="fg.muted">
                      {t.displayOrder}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={t.active ? "green" : "gray"}
                      variant="subtle"
                      size="sm"
                    >
                      {t.active ? "Активен" : "Неактивен"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {t.system ? (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        Системный
                      </Badge>
                    ) : (
                      <Badge colorPalette="blue" variant="subtle" size="sm">
                        Пользовательская
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Действия"
                        >
                          <LuChevronDown />
                        </IconButton>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content minW="160px">
                            <Menu.Item
                              value="edit"
                              disabled={t.system}
                              onClick={() => !t.system && openEdit(t)}
                            >
                              <LuPencil /> Редактировать
                            </Menu.Item>
                            <Menu.Separator />
                            <Menu.Item
                              value="delete"
                              color="red.500"
                              disabled={t.system}
                              onClick={() => !t.system && setDeleteTarget(t)}
                            >
                              <LuTrash2 /> Удалить
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Edit dialog */}
      <Dialog.Root
        open={!!editTarget}
        onOpenChange={(e) => {
          if (!e.open) setEditTarget(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="440px">
              <Dialog.Header>
                <Dialog.Title>Редактировать тип специалиста</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <SpecialistTypeForm form={editForm} onChange={setEditForm} />
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  onClick={handleUpdate}
                  disabled={!editForm.code.trim() || !editForm.name.trim()}
                  loading={isUpdating}
                >
                  Сохранить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete dialog */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(e) => {
          if (!e.open) setDeleteTarget(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>Удалить тип специалиста?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Тип <Text as="strong">«{deleteTarget?.name}»</Text> будет
                  удалён.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  loading={isDeleting}
                  onClick={() => {
                    deleteSpecialistType(deleteTarget!.id);
                    setDeleteTarget(null);
                  }}
                >
                  Удалить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function SpecialistTypeForm({
  form,
  onChange,
}: {
  form: TypeForm;
  onChange: (f: TypeForm) => void;
}) {
  const set = (patch: Partial<TypeForm>) => onChange({ ...form, ...patch });

  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={2} fontSize="sm">
          Код{" "}
          <Text as="span" color="red.500">
            *
          </Text>
        </Text>
        <Input
          placeholder="SYSADMIN"
          value={form.code}
          onChange={(e) => set({ code: e.target.value.toUpperCase() })}
          maxLength={80}
          fontFamily="mono"
        />
      </Box>
      <Box>
        <Text fontWeight="medium" mb={2} fontSize="sm">
          Название{" "}
          <Text as="span" color="red.500">
            *
          </Text>
        </Text>
        <Input
          placeholder="Системный администратор"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          maxLength={150}
        />
      </Box>
      <Box>
        <Text fontWeight="medium" mb={2} fontSize="sm">
          Порядок отображения
        </Text>
        <Input
          type="number"
          value={form.displayOrder}
          onChange={(e) => set({ displayOrder: parseInt(e.target.value) || 0 })}
          min={0}
        />
      </Box>
      <Box>
        <Text fontWeight="medium" mb={2} fontSize="sm">
          Цвет
        </Text>
        <ColorPicker
          value={form.color ?? "gray"}
          onChange={(c) => set({ color: c })}
        />
      </Box>
      <HStack justify="space-between">
        <Text fontWeight="medium" fontSize="sm">
          Активен
        </Text>
        <Switch.Root
          checked={form.active}
          onCheckedChange={(e) => set({ active: e.checked })}
        >
          <Switch.HiddenInput />
          <Switch.Control />
        </Switch.Root>
      </HStack>
    </VStack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  return (
    <Box>
      <Flex mb={6} direction="column" gap={1}>
        <Heading size="lg" color="fg.default">
          Роли и типы специалистов
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Управление системными ролями, правами доступа и типами специалистов
        </Text>
      </Flex>

      <Tabs.Root defaultValue="roles" variant="line">
        <Tabs.List mb={6}>
          <Tabs.Trigger value="roles">
            <LuShieldCheck />
            Роли
          </Tabs.Trigger>
          <Tabs.Trigger value="types">
            <LuShield />
            Типы специалистов
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="roles">
          <RolesTab />
        </Tabs.Content>
        <Tabs.Content value="types">
          <SpecialistTypesTab />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
