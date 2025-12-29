import { AdminUser } from "@/lib/api/admin";
import {
  Text,
  Button,
  CloseButton,
  Spinner,
  Portal,
  Dialog,
} from "@chakra-ui/react";

interface DeleteUserProps {
  isDeleteOpen: boolean;
  closeDelete: () => void;
  handleDeleteUser: () => Promise<void>;
  isSubmitting: boolean;
  selectedUser: AdminUser | null;
}

export default function DeleteUser({
  isDeleteOpen,
  closeDelete,
  handleDeleteUser,
  isSubmitting,
  selectedUser,
}: DeleteUserProps) {
  return (
    <Dialog.Root
      open={isDeleteOpen}
      onOpenChange={(e) => !e.open && closeDelete()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Удалить пользователя?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Вы уверены, что хотите удалить пользователя{" "}
                <strong>@{selectedUser?.username}</strong>?
              </Text>
              <Text color="fg.muted" fontSize="sm" mt={2}>
                Это действие нельзя отменить.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeDelete}>
                Отмена
              </Button>
              <Button
                colorPalette="red"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner size="sm" /> : "Удалить"}
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
