"use client";

import { useRef, useEffect } from "react";
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
} from "@chakra-ui/react";
import {
  LuPencil,
  LuTrash2,
} from "react-icons/lu";
import {
  getSenderConfig,
  type Message,
} from "@/types/message";
import { AttachmentItem } from "./AttachmentItem";

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: number | undefined;
  isLoading: boolean;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: number) => void;
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
  username: string | undefined
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

export function ChatMessageList({
  messages,
  currentUserId,
  isLoading,
  onEditMessage,
  onDeleteMessage,
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
                      {msg.content}
                    </Text>
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <VStack gap={2} mt={2} align="stretch">
                        {msg.attachments.map((att) => (
                          <AttachmentItem 
                            key={att.id} 
                            attachment={att} 
                            isOwn={isOwn} 
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
                {isOwn && (onEditMessage || onDeleteMessage) && (
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content minW="150px">
                        {onEditMessage && (
                          <Menu.Item
                            value="edit"
                            onClick={() => onEditMessage(msg)}
                          >
                            <LuPencil />
                            Редактировать
                          </Menu.Item>
                        )}
                        {onDeleteMessage && (
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
                )}
              </Menu.Root>
            </Flex>
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </VStack>
  );
}