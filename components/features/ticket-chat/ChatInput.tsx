import { Button, Flex, Input } from "@chakra-ui/react";
import { RefObject } from "react";
import { LuPaperclip, LuSend } from "react-icons/lu";

interface ChatInputProps {
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSend: () => void;
  isSending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFile: File | null;
  isChatInactive: boolean;
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
  isChatInactive,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return !isChatInactive ? (
    <Flex gap={2} align="center">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelect}
        disabled
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled
      >
        <LuPaperclip />
      </Button>
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Введите сообщение..."
        bg="bg.surface"
        borderColor="border.default"
        _focus={{ borderColor: "gray.400" }}
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
        <LuSend />
      </Button>
    </Flex>
  ) : (
    <Flex gap={2} align="center">
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
      />
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
        <LuSend />
      </Button>
    </Flex>
  );
}
