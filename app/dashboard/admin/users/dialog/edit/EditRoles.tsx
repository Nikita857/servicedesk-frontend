"use client";

import { Tooltip } from "@/components/ui/tooltip";
import type { AdminUserResponse } from "@/types/admin";
import { useRoles } from "@/lib/hooks/rbac/userRoles";
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
  selectedUser: AdminUserResponse | null;
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
  const { data: allRoles = [] } = useRoles();

  return (
    <Dialog.Root
      open={isEditRolesOpen && !!selectedUser}
      onOpenChange={(e) => !e.open && closeEditRoles()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Роли: {selectedUser?.username}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap={2} flexWrap="wrap">
                {allRoles.map((role) => (
                  <Tooltip key={role.code} content={role.description ?? ""}>
                    <Badge
                      colorPalette={role.color}
                      variant={editRoles.includes(role.code) ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleRole(role.code, editRoles, setEditRoles)}
                    >
                      {editRoles.includes(role.code) ? <LuCheck size={12} /> : null}
                      {role.name}
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
