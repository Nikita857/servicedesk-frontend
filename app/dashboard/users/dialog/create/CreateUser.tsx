import { DataSelect } from "@/components/ui";
import { Tooltip } from "@/components/ui/tooltip";
import { adminApi, CreateUserParams } from "@/lib/api/admin";
import { SenderType, userRolesBadges } from "@/types";
import {
  Badge,
  Button,
  CloseButton,
  createListCollection,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { LuCheck } from "react-icons/lu";

interface CreateUserProps {
  isCreateOpen: boolean;
  closeCreate: () => void;
  newUser: CreateUserParams;
  setNewUser: (newUser: CreateUserParams) => void;
  handleCreateUser: () => void;
  toggleRole: (
    roleKey: string,
    roles: string[],
    callback: (updatedRoles: string[]) => void,
  ) => void;
  departmentId: number | null;
  setDepartmentId: (id: number | null) => void;
  positionId: number | null;
  setPositionId: (id: number | null) => void;
  isSubmitting: boolean;
}

export default function CreateUser({
  isCreateOpen,
  closeCreate,
  newUser,
  setNewUser,
  handleCreateUser,
  toggleRole,
  departmentId,
  setDepartmentId,
  positionId,
  setPositionId,
  isSubmitting,
}: CreateUserProps) {
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
    enabled: isCreateOpen,
  });

  // Fetch positions for selected department
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["admin", "positions", departmentId],
    queryFn: () => adminApi.getPositionsByDepartment(departmentId!),
    enabled: isCreateOpen && !!departmentId,
  });

  const deptCollection = useMemo(
    () =>
      createListCollection({
        items: departments.map((d) => ({
          label: d.name,
          value: d.id.toString(),
        })),
      }),
    [departments],
  );

  const posCollection = useMemo(
    () =>
      createListCollection({
        items: positions.map((p) => ({
          label: p.name,
          value: p.id.toString(),
        })),
      }),
    [positions],
  );

  return (
    <Dialog.Root
      open={isCreateOpen}
      onOpenChange={(e) => !e.open && closeCreate()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Новый пользователь</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <Field.Root>
                  <Field.Label>Username *</Field.Label>
                  <Input
                    value={newUser.username || ""}
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
                    value={newUser.password || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>E-mail</Field.Label>
                  <Input
                    type="email"
                    value={newUser.email || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="E-mail"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>ФИО</Field.Label>
                  <Input
                    value={newUser.fio || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fio: e.target.value })
                    }
                    placeholder="Иванов Иван Иванович"
                  />
                </Field.Root>

                <Field.Root>
                  <VStack w="full" gap={3}>
                    <DataSelect
                      label="Отдел"
                      placeholder={
                        isLoadingDepts ? "Загрузка..." : "Выберите отдел"
                      }
                      collection={deptCollection}
                      value={departmentId ? [departmentId.toString()] : []}
                      onValueChange={(e) => {
                        const id = e.value[0] ? parseInt(e.value[0]) : null;
                        setDepartmentId(id);
                        setPositionId(null);
                      }}
                      disabled={isLoadingDepts}
                      portalled={false}
                      width="100%"
                    />

                    <DataSelect
                      label="Должность"
                      placeholder={
                        !departmentId
                          ? "Сначала выберите отдел"
                          : isLoadingPositions
                            ? "Загрузка..."
                            : "Выберите должность"
                      }
                      collection={posCollection}
                      value={positionId ? [positionId.toString()] : []}
                      onValueChange={(e) => {
                        const id = e.value[0] ? parseInt(e.value[0]) : null;
                        setPositionId(id);
                      }}
                      disabled={!departmentId || isLoadingPositions}
                      portalled={false}
                      width="100%"
                    />
                  </VStack>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Роли</Field.Label>
                  <HStack gap={2} flexWrap="wrap">
                    {Object.entries(userRolesBadges).map(
                      ([roleKey, roleData]) => (
                        <Tooltip key={roleKey} content={roleData.description}>
                          <Badge
                            colorPalette={roleData.color}
                            variant={
                              newUser.roles?.includes(roleKey as SenderType)
                                ? "solid"
                                : "outline"
                            }
                            cursor="pointer"
                            onClick={() =>
                              toggleRole(roleKey, newUser.roles || [], (r) =>
                                setNewUser({
                                  ...newUser,
                                  roles: r as SenderType[],
                                }),
                              )
                            }
                          >
                            {newUser.roles?.includes(roleKey as SenderType) && (
                              <LuCheck size={12} />
                            )}
                            {roleData.name}
                          </Badge>
                        </Tooltip>
                      ),
                    )}
                  </HStack>
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" onClick={closeCreate}>
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
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
