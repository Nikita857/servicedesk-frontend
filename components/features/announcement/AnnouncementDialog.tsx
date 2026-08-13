"use client";

import {
  Dialog,
  Portal,
  Button,
  Box,
  HStack,
  DataList,
  Badge,
  Blockquote,
} from "@chakra-ui/react";
import { LuMegaphone } from "react-icons/lu";
import { useMarkAnnouncementRead } from "@/lib/hooks/announcements";
import type {
  AnnouncementDetailResponse,
  MyAnnouncementResponse,
} from "@/types/announcement";

type AnnouncementLike = MyAnnouncementResponse | AnnouncementDetailResponse;

interface AnnouncementDialogProps {
  announcement: AnnouncementLike | null;
  /** Обязательное прочтение — нельзя закрыть кликом снаружи/Esc/крестиком, только кнопкой "Прочитано". */
  mandatory?: boolean;
  onClose: () => void;
  onRead?: () => void;
}

export function AnnouncementDialog({
  announcement,
  mandatory = false,
  onClose,
  onRead,
}: AnnouncementDialogProps) {
  const markReadMutation = useMarkAnnouncementRead();

  const handleMarkRead = () => {
    if (!announcement) return;
    markReadMutation.mutate(announcement.id, {
      onSuccess: () => {
        onRead?.();
        onClose();
      },
    });
  };

  return (
    <Dialog.Root
      open={!!announcement}
      closeOnInteractOutside={!mandatory}
      closeOnEscape={!mandatory}
      onOpenChange={(e) => {
        if (!e.open && !mandatory) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <HStack gap={2}>
                <Box color="fg.muted">
                  <LuMegaphone size={18} />
                </Box>
                <Dialog.Title>{announcement?.title}</Dialog.Title>
              </HStack>
            </Dialog.Header>

            {!mandatory && <Dialog.CloseTrigger />}

            <Dialog.Body>
              <DataList.Root orientation="horizontal" mb={4}>
                <DataList.Item>
                  <DataList.ItemLabel>Статус</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <Badge colorPalette={announcement?.read ? "green" : "yellow"}>
                      {announcement?.read ? "Прочитано" : "Не прочитано"}
                    </Badge>
                  </DataList.ItemValue>
                </DataList.Item>
                {announcement?.expiresAt && (
                  <DataList.Item>
                    <DataList.ItemLabel>Истекает</DataList.ItemLabel>
                    <DataList.ItemValue>
                      {new Date(announcement.expiresAt).toLocaleString("ru-RU")}
                    </DataList.ItemValue>
                  </DataList.Item>
                )}
              </DataList.Root>

              <Blockquote.Root>
                <Blockquote.Content whiteSpace="pre-wrap">
                  {announcement?.body}
                </Blockquote.Content>
              </Blockquote.Root>
            </Dialog.Body>

            <Dialog.Footer>
              {announcement?.read ? (
                <Button variant="outline" onClick={onClose}>
                  Закрыть
                </Button>
              ) : (
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  loading={markReadMutation.isPending}
                  onClick={handleMarkRead}
                >
                  Прочитано
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
