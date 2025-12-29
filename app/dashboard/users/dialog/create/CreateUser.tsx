import { Tooltip } from "@/components/ui/tooltip";
import { CreateUserParams } from "@/lib/api/admin";
import { userRolesBadges } from "@/types";
import {
  Badge,
  Button,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface CreateUserProps {
  isCreateOpen: boolean;
  openCreate: () => void;
  newUser: CreateUserParams;
  setNewUser: (newUser: CreateUserParams) => void;
  handleCreateUser: () => void;
  isSubmitting: boolean;
  toggleRole: (
    roleKey: string,
    roles: string[],
    callback: (updatedRoles: string[]) => void
  ) => void;
}

export default function CreateUser({
  isCreateOpen,
  openCreate,
  newUser,
  setNewUser,
  handleCreateUser,
  isSubmitting,
  toggleRole,
}: CreateUserProps) {
  return (
    <Dialog.Root open={isCreateOpen} onOpenChange={openCreate}>
      <Portal>
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
                <Field.Label>Роли</Field.Label>
                <HStack gap={2} flexWrap="wrap">
                  {Object.entries(userRolesBadges).map(
                    ([roleKey, roleData]) => (
                      <Tooltip key={roleKey} content={roleData.description}>
                        <Badge
                          colorPalette={roleData.color}
                          variant={
                            newUser.roles?.includes(roleKey)
                              ? "solid"
                              : "outline"
                          }
                          cursor="pointer"
                          onClick={() =>
                            toggleRole(roleKey, newUser.roles || [], (r) =>
                              setNewUser({ ...newUser, roles: r })
                            )
                          }
                        >
                          {newUser.roles?.includes(roleKey) && (
                            <LuCheck size={12} />
                          )}
                          {roleData.name}
                        </Badge>
                      </Tooltip>
                    )
                  )}
                </HStack>
              </Field.Root>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="outline" onClick={openCreate}>
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
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Portal>
    </Dialog.Root>
  );
}
