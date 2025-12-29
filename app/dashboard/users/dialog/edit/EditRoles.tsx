import { Tooltip } from "@/components/ui/tooltip";
import { CreateUserParams } from "@/lib/api/admin";
import { User, userRolesBadges } from "@/types";
import {
  HStack,
  Badge,
  Button,
  Spinner,
  Portal,
  Dialog,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface EditRolesProps {
  isEditRolesOpen: boolean;
  selectedUser: User | null;
  newUser: CreateUserParams;
  setNewUser: (user: CreateUserParams) => void;
  toggleRole: (
    role: string,
    currentRoles: string[],
    callback: (r: string[]) => void
  ) => void;
  closeEditRoles: () => void;
  handleUpdateRoles: () => void;
  isSubmitting: boolean;
  openEditRoles: (user: User) => void;
}

export default function EditRoles({
  isEditRolesOpen,
  selectedUser,
  newUser,
  setNewUser,
  toggleRole,
  closeEditRoles,
  handleUpdateRoles,
  isSubmitting,
  openEditRoles,
}: EditRolesProps) {
  if (!selectedUser) return null;

  return (
    <Dialog.Root
      open={isEditRolesOpen}
      onOpenChange={(e) =>
        e.open ? openEditRoles(selectedUser) : closeEditRoles()
      }
    >
      <Portal>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Роли: {selectedUser.username}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <HStack gap={2} flexWrap="wrap">
              {Object.entries(userRolesBadges).map(([roleKey, roleData]) => (
                <Tooltip key={roleKey} content={roleData.description}>
                  <Badge
                    colorPalette={roleData.color}
                    variant={
                      newUser.roles?.includes(roleKey) ? "solid" : "outline"
                    }
                    cursor="pointer"
                    onClick={() =>
                      toggleRole(roleKey, newUser.roles || [], (r) =>
                        setNewUser({ ...newUser, roles: r })
                      )
                    }
                  >
                    {newUser.roles?.includes(roleKey) ? (
                      <LuCheck size={12} />
                    ) : null}
                    {roleData.name}
                  </Badge>
                </Tooltip>
              ))}
            </HStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" onClick={closeEditRoles}>
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
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Portal>
    </Dialog.Root>
  );
}
