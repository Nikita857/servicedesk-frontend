import { Tooltip } from "@/components/ui/tooltip";
import { AdminUser } from "@/lib/api/admin";
import { userRolesBadges } from "@/types/auth";
import {
  HStack,
  Badge,
  Button,
  CloseButton,
  Spinner,
  Portal,
  Dialog,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface EditRolesProps {
  isEditRolesOpen: boolean;
  selectedUser: AdminUser | null;
  editRoles: string[];
  setEditRoles: (roles: string[]) => void;
  toggleRole: (
    role: string,
    currentRoles: string[],
    callback: (r: string[]) => void
  ) => void;
  closeEditRoles: () => void;
  handleUpdateRoles: () => void;
  isSubmitting: boolean;
}

export default function EditRoles({
  isEditRolesOpen,
  selectedUser,
  editRoles,
  setEditRoles,
  toggleRole,
  closeEditRoles,
  handleUpdateRoles,
  isSubmitting,
}: EditRolesProps) {
  if (!selectedUser) return null;

  return (
    <Dialog.Root
      open={isEditRolesOpen}
      onOpenChange={(e) => !e.open && closeEditRoles()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
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
                        editRoles.includes(roleKey) ? "solid" : "outline"
                      }
                      cursor="pointer"
                      onClick={() =>
                        toggleRole(roleKey, editRoles, setEditRoles)
                      }
                    >
                      {editRoles.includes(roleKey) ? (
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
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
