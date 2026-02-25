"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dialog,
  VStack,
  Text,
  Input,
  HStack,
} from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { toaster } from "@/components/ui/toaster";

interface DateTimePickerProps {
  ticketId: number;
  currentDate: string | null;
}

/**
 * Converts an ISO/Instant string to the value format for <input type="datetime-local">.
 * datetime-local operates in local time, so we adjust for timezone offset.
 */
function toLocalInputValue(isoString: string): string {
  const dt = new Date(isoString);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/** Returns the current local datetime as a min value for datetime-local input. */
function getLocalNow(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function DateTimePicker({ ticketId, currentDate }: DateTimePickerProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: (localDateTimeStr: string) => {
      // new Date("YYYY-MM-DDTHH:mm") treats input as local time → converts to UTC ISO
      const instant = new Date(localDateTimeStr).toISOString();
      return ticketApi.setEstimatedDate(ticketId, instant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(ticketId),
      });
      toaster.create({ title: "Срок выполнения установлен", type: "success" });
      setOpen(false);
    },
    onError: () => {
      toaster.create({ title: "Не удалось установить дату", type: "error" });
    },
  });

  const handleOpen = () => {
    setValue(currentDate ? toLocalInputValue(currentDate) : "");
    setOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        width="full"
      >
        <LuCalendar />
        {currentDate ? "Изменить срок" : "Установить срок"}
      </Button>

      <Dialog.Root
        open={open}
        onOpenChange={({ open: isOpen }) => setOpen(isOpen)}
        size="sm"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Ориентировочный срок выполнения</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" color="fg.muted">
                  Укажите дату и время — специалист постарается завершить работу к
                  этому сроку.
                </Text>
                <Input
                  type="datetime-local"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min={getLocalNow()}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={2} justify="flex-end" w="full">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={mutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={() => mutation.mutate(value)}
                  disabled={!value}
                  loading={mutation.isPending}
                >
                  Сохранить
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
