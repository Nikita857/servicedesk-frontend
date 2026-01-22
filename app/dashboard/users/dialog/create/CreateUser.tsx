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
import { useMemo, useState, useEffect } from "react";
import { LuCheck } from "react-icons/lu";
import { toast } from "@/lib/utils";

interface CreateUserProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: CreateUserParams) => void;
  isSubmitting: boolean;
}

export default function CreateUser({
  isOpen,
  onClose,
  onCreate,
  isSubmitting,
}: CreateUserProps) {
  const [newUser, setNewUser] = useState<CreateUserParams>({
    username: "",
    password: "",
    fio: "",
    email: "",
    roles: ["USER"],
    active: true,
    departmentId: null,
    positionId: null,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewUser({
        username: "",
        password: "",
        fio: "",
        email: "",
        roles: ["USER"],
        active: true,
        departmentId: null,
        positionId: null,
      });
    }
  }, [isOpen]);

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
    enabled: isOpen,
  });

  // Fetch positions for selected department
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["admin", "positions", newUser.departmentId],
    queryFn: () => adminApi.getPositionsByDepartment(newUser.departmentId!),
    enabled: isOpen && !!newUser.departmentId,
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

  const handleSubmit = () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Ошибка", "Заполните обязательные поля");
      return;
    }
    onCreate(newUser);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
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
                      value={
                        newUser.departmentId
                          ? [newUser.departmentId.toString()]
                          : []
                      }
                      onValueChange={(e) => {
                        const id = e.value[0] ? parseInt(e.value[0]) : null;
                        setNewUser({
                          ...newUser,
                          departmentId: id,
                          positionId: null,
                        });
                      }}
                      disabled={isLoadingDepts}
                      portalled={false}
                      width="100%"
                    />

                    <DataSelect
                      label="Должность"
                      placeholder={
                        !newUser.departmentId
                          ? "Сначала выберите отдел"
                          : isLoadingPositions
                            ? "Загрузка..."
                            : "Выберите должность"
                      }
                      collection={posCollection}
                      value={
                        newUser.positionId
                          ? [newUser.positionId.toString()]
                          : []
                      }
                      onValueChange={(e) => {
                        const id = e.value[0] ? parseInt(e.value[0]) : null;
                        setNewUser({ ...newUser, positionId: id });
                      }}
                      disabled={!newUser.departmentId || isLoadingPositions}
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
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                bg="gray.900"
                color="white"
                onClick={handleSubmit}
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
