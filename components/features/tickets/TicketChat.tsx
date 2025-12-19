import { useState, useRef } from "react";
import { Box, Flex, Text, Button, VStack, HStack } from "@chakra-ui/react";
import {
  LuWifi,
  LuWifiOff,
  LuPaperclip,
  LuX,
  LuFile,
  LuDownload,
} from "react-icons/lu";
import { messageApi } from "@/lib/api/messages";
import { attachmentApi } from "@/lib/api/attachments";
import { toaster } from "@/components/ui/toaster";
import { formatFileSize, validateFile, isImageType } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { TicketStatus } from "@/types";
import type { Message } from "@/types/message";
import axios from "axios";
import { useChatWebSocket } from "@/lib/hooks/useChatWebSocket";
import { ChatMessageList } from "../ticket-chat/ChatMessageList";
import ChatInput from "../ticket-chat/ChatInput";

interface TicketChatProps {
  ticketId: number;
  ticketStatus: TicketStatus;
}

export function TicketChat({ ticketId, ticketStatus }: TicketChatProps) {
  const { user } = useAuthStore();

  // Use custom hook for WebSocket and messages
  const {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
    sendMessage: wsSendMessage,
  } = useChatWebSocket(ticketId);

  // Local state for file handling
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      toaster.error({ title: "Ошибка", description: error });
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    const content = newMessage.trim();
    const fileToUpload = selectedFile;

    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Handle edit mode
    if (editingMessage) {
      try {
        const updatedMessage = await messageApi.edit(editingMessage.id, {
          content,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? updatedMessage : m))
        );
        toaster.success({ title: "Сообщение обновлено" });
      } catch (error) {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось обновить сообщение",
        });
        setNewMessage(content);
      } finally {
        setEditingMessage(null);
      }
      return;
    }

    // If we have a file, we need to create a message first then attach the file
    if (fileToUpload) {
      setIsUploading(true);
      try {
        // Create message with content or placeholder
        const messageContent = content || `📎 ${fileToUpload.name}`;
        const message = await messageApi.send(ticketId, {
          content: messageContent,
        });
        setMessages((prev) => [...prev, message]);

        // Upload file to this message
        await attachmentApi.uploadToMessage(message.id, fileToUpload);
        // WebSocket will update the message with attachment for all users
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          toaster.error({
            title: "Ошибка",
            description:
              error.response.data.message || "Не удалось загрузить файл",
            closable: true,
          });
        } else {
          toaster.error({
            title: "Ошибка",
            description: "Не удалось загрузить файл",
            closable: true,
          });
        }
      } finally {
        setIsUploading(false);
      }
    } else if (content) {
      // Send message without file via WebSocket
      if (isConnected && wsSendMessage(content)) return;

      setIsSending(true);
      try {
        const message = await messageApi.send(ticketId, { content });
        setMessages((prev) => [...prev, message]);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          toaster.error({
            title: "Ошибка",
            description:
              error.response.data.message || "Не удалось отправить сообщение",
            closable: true,
          });
        } else {
          toaster.error({
            title: "Ошибка",
            description: "Не удалось отправить сообщение",
            closable: true,
          });
        }
        setNewMessage(content);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    sendTypingIndicator(value.length > 0);
  };

  const handleSendWithTyping = () => {
    sendTypingIndicator(false);
    handleSend();
  };

  const isTicketActive = (status: TicketStatus): boolean => {
    return status !== "CLOSED" && status !== "CANCELLED";
  };

  const isImageType = (mimeType: string) => mimeType?.startsWith("image/");

  return (
    <VStack gap={4} align="stretch">
      {/* Chat Box */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        h="500px"
      >
        {/* Header */}
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border.default"
          justify="space-between"
          align="center"
          bg="bg.subtle"
        >
          <Text fontWeight="medium" color="fg.default">
            Сообщения ({messages.length})
          </Text>
          <HStack gap={2}>
            {isConnected ? (
              <HStack color="green.500" fontSize="xs">
                <LuWifi size={14} />
                <Text>Live</Text>
              </HStack>
            ) : (
              <HStack color="fg.muted" fontSize="xs">
                <LuWifiOff size={14} />
                <Text>Offline</Text>
              </HStack>
            )}
          </HStack>
        </Flex>

        {/* Messages */}
        <Box flex={1} overflowY="auto" p={4}>
          <ChatMessageList
            messages={messages}
            currentUserId={user?.id}
            isLoading={isLoading}
            onEditMessage={(msg) => {
              setEditingMessage(msg);
              setNewMessage(msg.content);
            }}
            onDeleteMessage={async (msgId) => {
              try {
                await messageApi.delete(msgId);
                setMessages((prev) => prev.filter((m) => m.id !== msgId));
                toaster.success({ title: "Сообщение удалено" });
              } catch (error) {
                toaster.error({
                  title: "Ошибка",
                  description: "Не удалось удалить сообщение",
                });
              }
            }}
          />
        </Box>

        {/* Input Section */}
        <Box
          p={3}
          borderTopWidth="1px"
          borderColor="border.default"
          bg="bg.subtle"
        >
          {/* Selected File Preview */}
          {selectedFile && (
            <Flex
              mb={2}
              p={2}
              bg="bg.muted"
              borderRadius="md"
              align="center"
              gap={2}
            >
              <LuPaperclip size={14} />
              <Text fontSize="sm" flex={1} truncate>
                {selectedFile.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {formatFileSize(selectedFile.size)}
              </Text>
              <Button size="xs" variant="ghost" onClick={handleRemoveFile}>
                <LuX size={14} />
              </Button>
            </Flex>
          )}

          {/* Typing Indicator */}
          {typingUser && (
            <Flex px={3} py={1} align="center" gap={2}>
              <Box className="typing-dots" display="flex" gap={1}>
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite"
                />
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite 0.2s"
                />
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite 0.4s"
                />
              </Box>
              <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                {typingUser.fio || typingUser.username} печатает...
              </Text>
            </Flex>
          )}

          {/* Chat Input */}
          {isTicketActive(ticketStatus) ? (
            <ChatInput
              handleFileSelect={handleFileSelect}
              isUploading={isUploading}
              newMessage={newMessage}
              setNewMessage={handleInputChange}
              handleSend={handleSendWithTyping}
              fileInputRef={fileInputRef}
              isSending={isSending}
              selectedFile={selectedFile}
              isChatInactive={false}
            />
          ) : (
            <ChatInput
              handleFileSelect={handleFileSelect}
              isUploading={isUploading}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSend={handleSend}
              fileInputRef={fileInputRef}
              isSending={isSending}
              selectedFile={selectedFile}
              isChatInactive={true}
            />
          )}
        </Box>
      </Box>
    </VStack>
  );
}
