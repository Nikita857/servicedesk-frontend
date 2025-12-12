"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Spinner,
  Avatar,
  Badge,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  LuSend,
  LuWifi,
  LuWifiOff,
  LuPaperclip,
  LuX,
  LuFile,
  LuDownload,
  LuImage,
} from "react-icons/lu";
import { messageApi } from "@/lib/api/messages";
import {
  attachmentApi,
  getAttachmentUrl,
  Attachment,
} from "@/lib/api/attachments";
import {
  ticketWebSocket,
  type ChatMessageWS,
  type TypingIndicator,
} from "@/lib/websocket/ticketWebSocket";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import type { Ticket, TicketStatus } from "@/types";
import axios from "axios";
import type { Message } from "@/types/message";
import { getSenderConfig, type SenderType } from "@/types/message";
import { ticketApi } from "@/lib/api";
import ChatInput from "../ticket-chat/ChatInput";

interface TicketChatProps {
  ticketId: number;
}

// TODO вын6ести эти константы в конфиг

// Blocked file extensions
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

export function TicketChat({ ticketId }: TicketChatProps) {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("OPEN");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typing indicator state
  const [typingUser, setTypingUser] = useState<{
    fio: string | null;
    username: string;
  } | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      await messageApi.markAsRead(ticketId);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    try {
      const data = await attachmentApi.getByTicket(ticketId);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to load attachments", error);
    }
  }, [ticketId]);

  const fetchTicket = useCallback(async () => {
    try {
      const response = await ticketApi.get(ticketId);
      setTicketStatus(response.status);
    } catch (error) {
      console.error("Failed to load ticket", error);
    }
  }, [ticketId]);

  // Connect to WebSocket
  useEffect(() => {
    fetchMessages();
    fetchAttachments();
    fetchTicket();

    if (accessToken) {
      ticketWebSocket.connect(ticketId, accessToken, {
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
        onMessage: (wsMessage: ChatMessageWS) => {
          const newMsg: Message = {
            id: wsMessage.id,
            ticketId: wsMessage.ticketId,
            content: wsMessage.content,
            sender: {
              id: wsMessage.senderId,
              username: wsMessage.senderUsername,
              fio: wsMessage.senderFio,
            },
            senderType: wsMessage.senderType as SenderType,
            internal: wsMessage.internal,
            readByUser: false,
            readBySpecialist: false,
            edited: false,
            createdAt: wsMessage.createdAt,
            updatedAt: wsMessage.createdAt,
          };

          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
        onTyping: (indicator: TypingIndicator) => {
          // Ignore own typing
          if (indicator.userId === user?.id) return;

          if (indicator.typing) {
            setTypingUser({ fio: indicator.fio, username: indicator.username });
            // Clear previous timeout
            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);
            // Hide after 3 seconds if no new typing event
            typingTimeoutRef.current = setTimeout(
              () => setTypingUser(null),
              3000
            );
          } else {
            setTypingUser(null);
          }
        },
        onError: (error) => console.error("[WS] Error:", error),
      });
    }

    return () => {
      ticketWebSocket.disconnect();
    };
  }, [ticketId, accessToken, fetchMessages, fetchAttachments]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Validate file
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
        toaster.success({
          title: "Файл загружен",
          description: selectedFile.name,
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh attachments
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

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    });
  const getInitials = (name: string | null, username: string) => {
    if (name)
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return username.slice(0, 2).toUpperCase();
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  const isImageType = (mimeType: string) => mimeType?.startsWith("image/");

  const isTicketActive = (ticketStatus: TicketStatus): boolean => {
    if (ticketStatus === "CLOSED" || ticketStatus === "CANCELLED") {
      return false;
    }
    return true;
  };

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Send typing indicator (debounced - max once per 1 second)
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1000) {
      ticketWebSocket.sendTyping(value.length > 0);
      lastTypingSentRef.current = now;
    }
  };

  // Send typing=false when message is sent
  const handleSendWithTyping = () => {
    ticketWebSocket.sendTyping(false);
    handleSend();
  };

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
          {isLoading ? (
            <Flex justify="center" align="center" h="100%">
              <Spinner />
            </Flex>
          ) : messages.length === 0 ? (
            <Flex justify="center" align="center" h="100%">
              <Text color="fg.muted" fontSize="sm">
                Нет сообщений. Начните диалог!
              </Text>
            </Flex>
          ) : (
            <VStack gap={3} align="stretch">
              {messages.map((msg, index) => {
                const isOwn = msg.sender.id === user?.id;
                const senderConf = getSenderConfig(msg.senderType);
                const showDateLabel =
                  index === 0 ||
                  formatDate(messages[index - 1].createdAt) !==
                    formatDate(msg.createdAt);

                return (
                  <Box key={msg.id}>
                    {showDateLabel && (
                      <Flex justify="center" mb={2}>
                        <Text
                          fontSize="xs"
                          color="fg.muted"
                          bg="bg.subtle"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                        >
                          {formatDate(msg.createdAt)}
                        </Text>
                      </Flex>
                    )}
                    <Flex justify={isOwn ? "flex-end" : "flex-start"} gap={2}>
                      {!isOwn && (
                        <Avatar.Root size="sm">
                          <Avatar.Fallback>
                            {getInitials(msg.sender.fio, msg.sender.username)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                      )}
                      <Box
                        maxW="70%"
                        bg={isOwn ? "gray.900" : "bg.subtle"}
                        color={isOwn ? "white" : "fg.default"}
                        px={3}
                        py={2}
                        borderRadius="lg"
                        borderTopRightRadius={isOwn ? "sm" : "lg"}
                        borderTopLeftRadius={isOwn ? "lg" : "sm"}
                      >
                        {!isOwn && (
                          <HStack mb={1} gap={2}>
                            <Text fontSize="xs" fontWeight="medium">
                              {msg.sender.fio || msg.sender.username}
                            </Text>
                            {msg.senderType !== "USER" && (
                              <Badge
                                size="sm"
                                colorPalette={senderConf.color}
                                variant="subtle"
                              >
                                {senderConf.label}
                              </Badge>
                            )}
                          </HStack>
                        )}
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {msg.content}
                        </Text>
                        <Flex justify="flex-end" mt={1}>
                          <Text fontSize="xs" opacity={0.7}>
                            {formatTime(msg.createdAt)}
                            {msg.edited && " (изм.)"}
                          </Text>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        {/* Selected file preview */}
        {selectedFile && (
          <Flex
            px={3}
            py={2}
            borderTopWidth="1px"
            borderColor="border.default"
            bg="bg.muted"
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

        {/* Input */}
        <Box
          p={3}
          borderTopWidth="1px"
          borderColor="border.default"
          bg="bg.subtle"
        >
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

          {/* TODO я здесь нахуярил эту пидорисню */}
          {/* Проверка тикета на статус - если не активен сообщения в чат не отправляются */}
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
