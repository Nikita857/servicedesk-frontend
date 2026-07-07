"use client";

import type { AdminUserResponse } from "@/types/admin";
import { useSpecialistTypes } from "@/lib/hooks/admin-specialistTypes/useSpecialistTypes";
import {
  HStack,
  VStack,
  Badge,
  Text,
  Button,
  CloseButton,
  Spinner,
  Portal,
  Dialog,
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

interface EditSpecialistTypeProps {
  isOpen: boolean;
  selectedUser: AdminUserResponse | null;
  onClose: () => void;
  onSave: (code: string | null) => void;
  isSubmitting: boolean;
}

export default function EditSpecialistType({
  isOpen,
  selectedUser,
  onClose,
  onSave,
  isSubmitting,
}: EditSpecialistTypeProps) {
  const { specialistTypes } = useSpecialistTypes();
  const current = selectedUser?.specialistType ?? null;

  return (
    <Dialog.Root
      open={isOpen && !!selectedUser}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Тип специалиста: {selectedUser?.username}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="start" gap={3}>
                <Text fontSize="sm" color="fg.muted">
                  Выберите тип или снимите текущий выбор
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {specialistTypes.map((st) => (
                    <Badge
                      key={st.code}
                      colorPalette={st.color}
                      variant={current === st.code ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => onSave(current === st.code ? null : st.code)}
                    >
                      {current === st.code ? <LuCheck size={12} /> : null}
                      {st.name}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Закрыть
              </Button>
              {current && (
                <Button
                  colorPalette="red"
                  variant="subtle"
                  onClick={() => onSave(null)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Снять тип"}
                </Button>
              )}
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
