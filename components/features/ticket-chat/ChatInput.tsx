"use client";

import { RefObject, useCallback, useRef, useState } from "react";
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

// ─── Resize handle ────────────────────────────────────────────────────────────
function ResizeHandle({ onResize }: { onResize: (dy: number) => void }) {
  const startY = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;

    const onMove = (ev: MouseEvent) => {
      if (startY.current === null) return;
      const dy = startY.current - ev.clientY; // drag up = increase height
      startY.current = ev.clientY;
      onResize(dy);
    };

    const onUp = () => {
      startY.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <Box
      position="absolute"
      bottom={0}
      right={0}
      w="20px"
      h="20px"
      cursor="ns-resize"
      onMouseDown={handleMouseDown}
      display="flex"
      alignItems="flex-end"
      justifyContent="flex-end"
      pb="3px"
      pr="3px"
      zIndex={1}
      opacity={0.35}
      _hover={{ opacity: 0.7 }}
      transition="opacity 0.15s"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <circle cx="8" cy="8" r="1.2" />
        <circle cx="4.5" cy="8" r="1.2" />
        <circle cx="8" cy="4.5" r="1.2" />
      </svg>
    </Box>
  );
}

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
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);

  const handleResize = (dy: number) => {
    setInputHeight((h) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h + dy)));
  };

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
      {/* Toolbar — прижата к полю ввода */}
      <Flex align="center" gap={1} px={2} pt={1.5}>
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
          disabled={false}
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
        <Box position="relative" flex={1}>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Написать сообщение..."
            bg="bg.subtle"
            borderColor="border.default"
            borderRadius="10px"
            resize="none"
            h={`${inputHeight}px`}
            minH={`${MIN_HEIGHT}px`}
            maxH={`${MAX_HEIGHT}px`}
            fontSize="sm"
            w="100%"
            overflow="auto"
            _focus={{ borderColor: "accent.600", boxShadow: "none" }}
            _placeholder={{ color: "fg.subtle" }}
          />
          <ResizeHandle onResize={handleResize} />
        </Box>

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
