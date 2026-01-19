"use client";

import { useRef, useEffect, ReactNode } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Spinner,
  Avatar,
  Badge,
  Menu,
  Portal,
  Link,
} from "@chakra-ui/react";
import { LuPencil, LuTrash2, LuCopy } from "react-icons/lu";
import { getSenderConfig, type Message } from "@/types/message";
import { AttachmentItem } from "./AttachmentItem";

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: number | undefined;
  isLoading: boolean;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: number) => void;
  onImageClick?: (url: string) => void;
}

// Helper functions
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

const getInitials = (
  name: string | null | undefined,
  username: string | undefined,
) => {
  if (name)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  return "??";
};

// URL regex pattern for detecting links
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

// Parse text and convert URLs to clickable links
const linkifyText = (text: string, isOwn: boolean): ReactNode[] => {
  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      // Reset regex lastIndex for next test
      URL_REGEX.lastIndex = 0;
      return (
        <Link
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          color={isOwn ? "blue.200" : "blue.500"}
          textDecoration="underline"
          _hover={{ color: isOwn ? "blue.100" : "blue.600" }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    // Reset regex lastIndex
    URL_REGEX.lastIndex = 0;
    return part;
  });
};

export function ChatMessageList({
  messages,
  currentUserId,
  isLoading,
  onEditMessage,
  onDeleteMessage,
  onImageClick,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Spinner />
      </Flex>
    );
  }

  if (messages.length === 0) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Text color="fg.muted" fontSize="sm">
          Нет сообщений. Начните диалог!
        </Text>
      </Flex>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {messages.map((msg, index) => {
        const isOwn = msg.sender.id === currentUserId;
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
                  {msg.sender.avatarUrl && (
                    <Avatar.Image src={msg.sender.avatarUrl} />
                  )}
                </Avatar.Root>
              )}
              <Menu.Root>
                <Menu.ContextTrigger asChild>
                  <Box
                    maxW="70%"
                    bg={isOwn ? "gray.900" : "bg.subtle"}
                    color={isOwn ? "white" : "fg.default"}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderTopRightRadius={isOwn ? "sm" : "lg"}
                    borderTopLeftRadius={isOwn ? "lg" : "sm"}
                    cursor="context-menu"
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
                    {msg.internal && (
                      <Badge
                        size="sm"
                        colorPalette="orange"
                        variant="subtle"
                        mb={1}
                      >
                        Внутреннее
                      </Badge>
                    )}
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {linkifyText(msg.content, isOwn)}
                    </Text>
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <VStack gap={2} mt={2} align="stretch">
                        {msg.attachments.map((att) => (
                          <AttachmentItem
                            key={att.id}
                            attachment={att}
                            isOwn={isOwn}
                            onImageClick={onImageClick}
                          />
                        ))}
                      </VStack>
                    )}
                    <HStack justify="flex-end" gap={1} mt={1}>
                      {msg.edited && (
                        <Text fontSize="xs" opacity={0.5}>
                          изм.
                        </Text>
                      )}
                      <Text fontSize="xs" opacity={0.7}>
                        {formatTime(msg.createdAt)}
                      </Text>
                    </HStack>
                  </Box>
                </Menu.ContextTrigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content minW="150px">
                      <Menu.Item
                        value="copy"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                        }}
                      >
                        <LuCopy />
                        Копировать
                      </Menu.Item>
                      {isOwn && onEditMessage && (
                        <Menu.Item
                          value="edit"
                          onClick={() => onEditMessage(msg)}
                        >
                          <LuPencil />
                          Редактировать
                        </Menu.Item>
                      )}
                      {isOwn && onDeleteMessage && (
                        <Menu.Item
                          value="delete"
                          color="fg.error"
                          onClick={() => onDeleteMessage(msg.id)}
                        >
                          <LuTrash2 />
                          Удалить
                        </Menu.Item>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Flex>
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </VStack>
  );
}
