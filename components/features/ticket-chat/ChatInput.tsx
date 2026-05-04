"use client";

import { RefObject, useCallback, useLayoutEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { LuPaperclip, LuSend, LuX } from "react-icons/lu";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { CustomEmojiPicker } from "./CustomEmojiPicker";
import { formatFileSize } from "@/lib/utils/formatters";

interface ChatInputProps {
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSend: () => void;
  isSending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  onClearFile?: () => void;
  isChatInactive: boolean;
  onPasteFile?: (file: File) => void;
}

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 300;

export default function ChatInput({
  handleFileSelect,
  isUploading,
  newMessage,
  setNewMessage,
  handleSend,
  fileInputRef,
  isSending,
  selectedFile,
  onClearFile,
  isChatInactive,
  onPasteFile,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.max(
      MIN_HEIGHT,
      Math.min(el.scrollHeight, MAX_HEIGHT),
    );
    el.style.height = `${newHeight}px`;
  }, []);

  // Пересчитываем высоту при каждом изменении сообщения (в т.ч. при очистке после отправки)
  useLayoutEffect(() => {
    adjustHeight();
  }, [newMessage, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !onPasteFile) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const extension = item.type.split("/")[1] || "png";
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const namedFile = new File(
              [file],
              `pasted-image-${timestamp}.${extension}`,
              { type: file.type },
            );
            onPasteFile(namedFile);
          }
          break;
        }
      }
    },
    [onPasteFile],
  );

  // ─── Inactive state ──────────────────────────────────────────────────────────
  if (isChatInactive) {
    return (
      <Box
        px={3}
        py={3}
        borderTopWidth="1px"
        borderColor="border.default"
        bg="bg.surface"
      >
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.default"
          borderRadius="10px"
          px={4}
          py={3}
          textAlign="center"
        >
          <Text fontSize="sm" color="fg.muted">
            Чат неактивен для этой заявки
          </Text>
        </Box>
      </Box>
    );
  }

  // ─── Active state ────────────────────────────────────────────────────────────
  return (
    <Box borderTopWidth="1px" bg="bg.surface" borderRadius="2xl">
      {/* Toolbar */}
      <Flex align="center" gap={1} px={2}>
        <>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <IconButton
            aria-label="Прикрепить файл"
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <LuPaperclip />
          </IconButton>
        </>

        <CustomEmojiPicker
          onSelect={(emoji) => setNewMessage(newMessage + emoji)}
        />

        <VoiceInputButton
          value={newMessage}
          onChange={setNewMessage}
          disabled={true}
        />

        {/* File chip */}
        {selectedFile && (
          <HStack
            gap={1.5}
            bg="accent.subtle"
            color="accent.fg"
            borderRadius="6px"
            px={2}
            py={1}
            ml={1}
          >
            <Text fontSize="xs" fontWeight="medium" maxW="160px" truncate>
              {selectedFile.name}
            </Text>
            <Text fontSize="xs" opacity={0.7}>
              {formatFileSize(selectedFile.size)}
            </Text>
            {onClearFile && (
              <IconButton
                aria-label="Удалить файл"
                variant="ghost"
                size="2xs"
                color="accent.fg"
                onClick={onClearFile}
              >
                <LuX />
              </IconButton>
            )}
          </HStack>
        )}
      </Flex>

      {/* Textarea + send */}
      <Flex align="flex-end" gap={2} px={2} pb={2} pt={1}>
        <Textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Написать сообщение..."
          bg="bg.subtle"
          borderColor="border.default"
          borderRadius="10px"
          resize="none"
          minH={`${MIN_HEIGHT}px`}
          maxH={`${MAX_HEIGHT}px`}
          rows={1} // ← ключевое: базовая высота = 1 строка
          fontSize="sm"
          overflow="auto"
          _focus={{ borderColor: "accent.600", boxShadow: "none" }}
          _placeholder={{ color: "fg.subtle" }}
        />

        <Button
          aria-label="Отправить"
          onClick={handleSend}
          loading={isSending || isUploading}
          bg="accent.800"
          color="white"
          borderRadius="10px"
          px={3}
          h="40px"
          flexShrink={0}
          _hover={{ bg: "accent.700" }}
        >
          <LuSend />
        </Button>
      </Flex>
    </Box>
  );
}
