import { AdminUser } from "@/lib/api/admin";
import {
  DialogTitle,
  Field,
  Button,
  Spinner,
  DialogCloseTrigger,
  Portal,
  Dialog,
  Input,
} from "@chakra-ui/react";

interface EditFioProps {
  isEditFioOpen: boolean;
  editFio: string;
  setEditFio: (arg: string) => void;
  closeEditFio: () => void;
  handleUpdateFio: () => Promise<void>;
  isSubmitting: boolean;
  selectedUser: AdminUser | null;
}

export default function EditFio({
  isEditFioOpen,
  editFio,
  setEditFio,
  closeEditFio,
  handleUpdateFio,
  isSubmitting,
  selectedUser,
}: EditFioProps) {
  return (
    <Dialog.Root
      open={isEditFioOpen}
      onOpenChange={(isOpen) =>{
        if (!isOpen) closeEditFio();
      }}
    >
      <Portal>
        <Dialog.Content>
          <Dialog.Header>
            <DialogTitle>ФИО: {selectedUser?.username}</DialogTitle>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Root>
              <Field.Label>ФИО</Field.Label>
              <Input
                value={editFio}
                onChange={(e) => setEditFio(e.target.value)}
                placeholder="Иванов Иван Иванович"
              />
            </Field.Root>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" onClick={closeEditFio}>
              Отмена
            </Button>
            <Button
              bg="gray.900"
              color="white"
              onClick={handleUpdateFio}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : "Сохранить"}
            </Button>
          </Dialog.Footer>
          <DialogCloseTrigger />
        </Dialog.Content>
      </Portal>
    </Dialog.Root>
  );
}
