import { AdminUser } from "@/lib/api/admin";
import {
  Field,
  Button,
  CloseButton,
  Spinner,
  Portal,
  Dialog,
  Input,
} from "@chakra-ui/react";

interface ChangePasswordProps {
  isChangePasswordOpen: boolean;
  newPassword: string;
  setNewPassword: (arg: string) => void;
  closeChangePassword: () => void;
  handleChangePassword: () => Promise<void>;
  isSubmitting: boolean;
  selectedUser: AdminUser | null;
}

export default function ChangePassword({
  isChangePasswordOpen,
  newPassword,
  setNewPassword,
  closeChangePassword,
  handleChangePassword,
  isSubmitting,
  selectedUser,
}: ChangePasswordProps) {
  return (
    <Dialog.Root
      open={isChangePasswordOpen}
      onOpenChange={(e) => !e.open && closeChangePassword()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Пароль: {selectedUser?.username}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root>
                <Field.Label>Новый пароль</Field.Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeChangePassword}>
                Отмена
              </Button>
              <Button
                bg="gray.900"
                color="white"
                onClick={handleChangePassword}
                disabled={isSubmitting || !newPassword}
              >
                {isSubmitting ? <Spinner size="sm" /> : "Изменить"}
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
