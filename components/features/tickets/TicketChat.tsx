"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  LuWifi,
  LuWifiOff,
  LuPaperclip,
  LuX,
  LuFile,
  LuDownload,
} from "react-icons/lu";
import { messageApi } from "@/lib/api/messages";
import {
  attachmentApi,
  getAttachmentUrl,
  Attachment,
} from "@/lib/api/attachments";
import { ticketWebSocket } from "@/lib/websocket/ticketWebSocket";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import type { TicketStatus } from "@/types";
import axios from "axios";
import { useChatWebSocket } from "@/lib/hooks/useChatWebSocket";
import { ChatMessageList } from "../ticket-chat/ChatMessageList";
import ChatInput from "../ticket-chat/ChatInput";

interface TicketChatProps {
  ticketId: number;
  ticketStatus: TicketStatus;
}

// File validation constants
const BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".msi",
  ".dll",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function TicketChat({ ticketId, ticketStatus }: TicketChatProps) {
  const { user } = useAuthStore();

  // Use custom hook for WebSocket and messages (no longer fetches ticketStatus)
  const {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
  } = useChatWebSocket(ticketId);

  // Local state for attachments and file handling
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    try {
      const data = await attachmentApi.getByTicket(ticketId);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to load attachments", error);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return "Файл слишком большой (макс. 10MB)";
    const fileName = file.name.toLowerCase();
    for (const ext of BLOCKED_EXTENSIONS) {
      if (fileName.endsWith(ext)) return `Тип файла не разрешён: ${ext}`;
    }
    return null;
  };

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
    setNewMessage("");

    // Upload file if selected
    if (selectedFile) {
      setIsUploading(true);
      try {
        await attachmentApi.uploadToTicket(ticketId, selectedFile);
        toaster.success({ title: "Успех", description: "Файл загружен" });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchAttachments();
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
    }

    // Send message if there's content
    if (content) {
      if (isConnected && ticketWebSocket.sendMessage(content)) return;

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={4}
        >
          <Flex justify="space-between" align="center" mb={3}>
            <HStack>
              <LuPaperclip size={16} />
              <Text fontWeight="medium" color="fg.default">
                Вложения ({attachments.length})
              </Text>
            </HStack>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowAttachments(!showAttachments)}
            >
              {showAttachments ? "Скрыть" : "Показать"}
            </Button>
          </Flex>

          {showAttachments && (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={3}>
              {attachments.map((att) => (
                <Box
                  key={att.id}
                  bg="bg.subtle"
                  borderRadius="md"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="border.default"
                >
                  {isImageType(att.mimeType) ? (
                    <a
                      href={getAttachmentUrl(att.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={getAttachmentUrl(att.url)}
                        alt={att.filename}
                        h="100px"
                        w="100%"
                        objectFit="cover"
                      />
                    </a>
                  ) : (
                    <Flex
                      h="100px"
                      justify="center"
                      align="center"
                      bg="bg.muted"
                    >
                      <LuFile size={32} color="gray" />
                    </Flex>
                  )}
                  <Box p={2}>
                    <Text fontSize="xs" truncate mb={1}>
                      {att.filename}
                    </Text>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="xs" color="fg.muted">
                        {formatFileSize(att.fileSize)}
                      </Text>
                      <a
                        href={getAttachmentUrl(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="xs" variant="ghost">
                          <LuDownload size={12} />
                        </Button>
                      </a>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}
    </VStack>
  );
}
