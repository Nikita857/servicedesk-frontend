import { Button, Flex, Input, Text } from "@chakra-ui/react";
import { RefObject, useCallback } from "react";
import { LuPaperclip, LuSend } from "react-icons/lu";
import { CustomEmojiPicker } from "./CustomEmojiPicker";

interface ChatInputProps {
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSend: () => void;
  isSending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  isChatInactive: boolean;
  isEditing?: boolean;
  onPasteFile?: (file: File) => void;
}

export default function ChatInput({
  handleFileSelect,
  isUploading,
  newMessage,
  setNewMessage,
  handleSend,
  fileInputRef,
  isSending,
  isChatInactive,
  isEditing,
  onPasteFile,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle paste event for images from clipboard
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !onPasteFile) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Check if the pasted item is an image
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Create a new file with a proper name
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

  return !isChatInactive ? (
    <Flex gap={2} align="center">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <LuPaperclip />
      </Button>
      <CustomEmojiPicker
        onSelect={(emoji) => setNewMessage(newMessage + emoji)}
      />
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Введите сообщение... (Ctrl+V для вставки изображения)"
        bg="bg.surface"
        borderColor="border.default"
        _focus={{ borderColor: "gray.400" }}
        flex={1}
      />
      <Button
        onClick={handleSend}
        loading={isSending || isUploading}
        bg="gray.900"
        color="white"
        _hover={{ bg: "gray.800" }}
      >
        {isEditing ? <Text fontSize="sm">Сохранить</Text> : <LuSend />}
      </Button>
    </Flex>
  ) : (
    <Flex gap={2} align="center">
      <input ref={fileInputRef} type="file" style={{ display: "none" }} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled
      >
        <LuPaperclip />
      </Button>
      <Input
        value="В этом тикете чат неактивен"
        onKeyDown={handleKeyDown}
        bg="bg.surface"
        borderColor="border.default"
        disabled
        flex={1}
      />
      <Button
        onClick={handleSend}
        disabled
        loading={isSending || isUploading}
        bg="gray.900"
        color="white"
        _hover={{ bg: "gray.800" }}
      >
        {isEditing ? <Text fontSize="sm">Сохранить</Text> : <LuSend />}
      </Button>
    </Flex>
  );
}
