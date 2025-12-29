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
  Button,
  Text,
} from "@chakra-ui/react";
import {
  LuUsers,
  LuUserX,
  LuUserCheck,
  LuPencil,
  LuShield,
  LuKey,
  LuTrash,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { SenderType, User, userRolesBadges } from "@/types";
import { AdminUser } from "@/lib/api/admin";

interface UsersTableProps {
  isLoading: boolean;
  searchQuery: string;
  users: User[];
  handleToggleActive: (arg: AdminUser) => void;
  openEditFio: (arg: AdminUser) => void;
  openEditRoles: (arg: AdminUser) => void;
  openChangePassword: (arg: AdminUser) => void;
  openDelete: (arg: AdminUser) => void;
  totalPages: number;
  page: number;
  setPage: (arg: number) => void;
  user: User | null;
}
const getRoleBadge = (role: string) => {
  const roleData = userRolesBadges[role as SenderType];
  return (
    <Tooltip content={roleData.description}>
      <Badge
        key={role}
        colorPalette={roleData?.color || "gray"}
        size="sm"
        variant="subtle"
      >
        {roleData?.name || role}
      </Badge>
    </Tooltip>
  );
};

export default function UsersTable({
  isLoading,
  searchQuery,
  users,
  handleToggleActive,
  openEditFio,
  openEditRoles,
  openChangePassword,
  openDelete,
  totalPages,
  page,
  setPage,
  user,
}: UsersTableProps) {
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
                          <Tooltip content="Пользователь способный обрабатывать тикеты">
                            <Badge
                              colorPalette="orange"
                              size="sm"
                              variant="outline"
                            >
                              Специалист
                            </Badge>
                          </Tooltip>
                        )}
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
    </>
  );
}
