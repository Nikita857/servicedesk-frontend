import {
  Flex,
  Spinner,
  Box,
  Table,
  VStack,
  HStack,
  Badge,
  Switch,
  Icon,
  IconButton,
  Text,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { memo } from "react";
import {
  LuUsers,
  LuUserX,
  LuUserCheck,
  LuPencil,
  LuShield,
  LuKey,
  LuTrash,
  LuBuilding2,
  LuChevronDown,
  LuBriefcase,
} from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { useRoles } from "@/lib/hooks/rbac/userRoles";
import { useSpecialistTypes } from "@/lib/hooks/admin-specialistTypes/useSpecialistTypes";
import type { AdminUserResponse } from "@/types/admin";
import type { SpecialistTypeResponse } from "@/types/support-line";
import { getRoleBadge } from "@/lib/utils/roleColors";
import { SDPagination } from "@/components/ui/SDPagination";
import { Page } from "@/types";

interface UsersTableProps {
  isLoading: boolean;
  searchQuery: string;
  users: AdminUserResponse[];
  handleToggleActive: (arg: AdminUserResponse) => void;
  openEditFio: (arg: AdminUserResponse) => void;
  openEditRoles: (arg: AdminUserResponse) => void;
  openChangePassword: (arg: AdminUserResponse) => void;
  openDelete: (arg: AdminUserResponse) => void;
  page: Page | undefined;
  setPage: (arg: number) => void;
  user: AdminUserResponse | null;
  openEditOrg: (arg: AdminUserResponse) => void;
  openEditSpecialistType: (arg: AdminUserResponse) => void;
}

const getSpecialistBadge = (
  code: string,
  specialistTypes: SpecialistTypeResponse[],
) => {
  const found = specialistTypes.find((st) => st.code === code);
  return (
    <Badge
      key="st"
      colorPalette={found?.color ?? "gray"}
      size="sm"
      variant="outline"
    >
      {found?.name ?? code}
    </Badge>
  );
};

const UsersTable = memo(function UsersTable({
  isLoading,
  searchQuery,
  users,
  handleToggleActive,
  openEditFio,
  openEditRoles,
  openChangePassword,
  openDelete,
  page,
  setPage,
  user,
  openEditOrg,
  openEditSpecialistType,
}: UsersTableProps) {
  const { data: allRoles = [] } = useRoles();
  const { specialistTypes } = useSpecialistTypes();

  return (
    <>
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
            mb={3}
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
                          @{u.username}{" "}
                          {u.specialist && (
                            <Tooltip content="Пользователь способный обрабатывать заявки">
                              <Badge
                                colorPalette="orange"
                                size="sm"
                                variant="outline"
                              >
                                Специалист
                              </Badge>
                            </Tooltip>
                          )}
                        </Text>
                        {(u.departmentName || u.positionName) && (
                          <Text fontSize="xs" color="fg.muted">
                            {u.departmentName}
                            {u.departmentName && u.positionName && " / "}
                            {u.positionName}
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1} flexWrap="wrap">
                        {u.roles.map((role) => getRoleBadge(role, allRoles))}
                        {u.specialistType &&
                          getSpecialistBadge(u.specialistType, specialistTypes)}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack>
                        <Text
                          fontSize="sm"
                          color={u.active ? "green.500" : "fg.muted"}
                        >
                          {u.active ? "Активен" : "Неактивен"}
                        </Text>
                        <Switch.Root
                          colorPalette="green"
                          size="lg"
                          checked={u.active}
                          onCheckedChange={() => handleToggleActive(u)}
                        >
                          <Switch.HiddenInput />
                          <Switch.Control>
                            <Switch.Thumb />
                            <Switch.Indicator
                              fallback={<Icon as={LuUserX} color="gray.400" />}
                            >
                              <Icon as={LuUserCheck} color="white" />
                            </Switch.Indicator>
                          </Switch.Control>
                        </Switch.Root>
                      </HStack>
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
                            <Menu.Content minW="200px">
                              <Menu.Item
                                value="edit-fio"
                                onClick={() => openEditFio(u)}
                              >
                                <LuPencil /> Редактировать ФИО
                              </Menu.Item>
                              <Menu.Item
                                value="edit-org"
                                onClick={() => openEditOrg(u)}
                              >
                                <LuBuilding2 /> Организация
                              </Menu.Item>
                              <Menu.Item
                                value="edit-roles"
                                onClick={() => openEditRoles(u)}
                              >
                                <LuShield /> Управление ролями
                              </Menu.Item>
                              <Menu.Item
                                value="edit-specialist-type"
                                onClick={() => openEditSpecialistType(u)}
                              >
                                <LuBriefcase /> Тип специалиста
                              </Menu.Item>
                              <Menu.Item
                                value="change-password"
                                onClick={() => openChangePassword(u)}
                              >
                                <LuKey /> Сменить пароль
                              </Menu.Item>
                              <Menu.Separator />
                              <Menu.Item
                                value="delete"
                                color="red.500"
                                onClick={() => openDelete(u)}
                                disabled={u.id === user?.id}
                              >
                                <LuTrash /> Удалить
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

          {/* Pagination */}
          {page && page.totalPages > 1 && (
            <SDPagination page={page} action={setPage} size="sm" />
          )}
        </>
      )}
    </>
  );
});

export default UsersTable;
