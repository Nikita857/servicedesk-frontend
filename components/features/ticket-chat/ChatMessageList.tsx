"use client";

import { useRef, useEffect, ReactNode, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Spinner,
  Avatar,
  Badge,
  Portal,
} from "@chakra-ui/react";
import { LuTrash2, LuCheck, LuCheckCheck } from "react-icons/lu";
import { getSenderConfig, type Message } from "@/types/message";
import { AttachmentItem } from "./AttachmentItem";

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: number | undefined;
  isSpecialist: boolean;
  isLoading: boolean;
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
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isOwn ? "#93c5fd" : "#3b82f6",
            textDecoration: "underline",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    URL_REGEX.lastIndex = 0;
    return part;
  });
};

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  isSpecialist: boolean;
  onDeleteMessage?: (messageId: number) => void;
  onImageClick?: (url: string) => void;
}

function MessageBubble({
  msg,
  isOwn,
  isSpecialist,
  onDeleteMessage,
  onImageClick,
}: MessageBubbleProps) {
  const senderConf = getSenderConfig(msg.senderType);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Есть ли что показать в контекст-меню
  const canDelete = isOwn && isSpecialist && !!onDeleteMessage;
  const hasContextActions = canDelete;

  const handleContextMenu = (e: React.MouseEvent) => {
    // Если есть выделенный текст — не показываем кастомное меню, даём браузерное
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    if (!hasContextActions) return;

    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setMenuPos(null);

  return (
    <>
      <Box
        maxW={{ base: "85%", md: "70%" }}
        bg={isOwn ? "gray.900" : "bg.subtle"}
        color={isOwn ? "white" : "fg.default"}
        px={{ base: 2.5, md: 3 }}
        py={2}
        borderRadius="lg"
        borderTopRightRadius={isOwn ? "sm" : "lg"}
        borderTopLeftRadius={isOwn ? "lg" : "sm"}
        userSelect="text"
        onContextMenu={handleContextMenu}
      >
        {!isOwn && (
          <HStack mb={1} gap={1.5}>
            <Text fontSize="xs" fontWeight="semibold" color={isOwn ? "white" : `${senderConf.color}.600`}>
              {msg.sender.fio || msg.sender.username}
            </Text>
            {msg.senderType !== "USER" && (
              <Text fontSize="xs" color={isOwn ? "whiteAlpha.600" : "fg.subtle"}>
                {senderConf.label}
              </Text>
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
        <Text
          fontSize="sm"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
          userSelect="text"
          cursor="text"
        >
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
          {isOwn && (() => {
            const isRead = isSpecialist ? msg.readByUser : msg.readBySpecialist;
            return isRead ? (
              <LuCheckCheck size={14} style={{ opacity: 0.9, color: "#60a5fa" }} />
            ) : (
              <LuCheck size={14} style={{ opacity: 0.5 }} />
            );
          })()}
        </HStack>
      </Box>

      {/* Context menu — только для специалистов, позиционируется по координатам клика */}
      {menuPos && hasContextActions && (
        <Portal>
          {/* Overlay для закрытия */}
          <Box
            position="fixed"
            inset={0}
            zIndex={1000}
            onClick={closeMenu}
            onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}
          />
          <Box
            position="fixed"
            left={`${menuPos.x}px`}
            top={`${menuPos.y}px`}
            zIndex={1001}
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.default"
            borderRadius="md"
            shadow="lg"
            py={1}
            minW="150px"
          >
            {canDelete && (
              <Flex
                px={3}
                py={2}
                gap={2}
                align="center"
                cursor="pointer"
                _hover={{ bg: "bg.subtle" }}
                fontSize="sm"
                color="fg.error"
                onClick={() => { onDeleteMessage(msg.id); closeMenu(); }}
              >
                <LuTrash2 size={14} />
                Удалить
              </Flex>
            )}
          </Box>
        </Portal>
      )}
    </>
  );
}

export function ChatMessageList({
  messages,
  currentUserId,
  isSpecialist,
  isLoading,
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
    <VStack gap={2} align="stretch">
      {messages.map((msg, index) => {
        const isOwn = msg.sender.id === currentUserId;
        const showDateLabel =
          index === 0 ||
          formatDate(messages[index - 1].createdAt) !==
            formatDate(msg.createdAt);

        return (
          <Box key={msg.id}>
            {showDateLabel && (
              <Flex justify="center" mb={2} mt={index > 0 ? 2 : 0}>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  bg="bg.subtle"
                  px={3}
                  py={0.5}
                  borderRadius="full"
                >
                  {formatDate(msg.createdAt)}
                </Text>
              </Flex>
            )}
            <Flex
              justify={isOwn ? "flex-end" : "flex-start"}
              gap={2}
              align="flex-end"
            >
              {!isOwn && (
                <Avatar.Root size="sm" flexShrink={0}>
                  <Avatar.Fallback>
                    {getInitials(msg.sender.fio, msg.sender.username)}
                  </Avatar.Fallback>
                  {msg.sender.avatarUrl && (
                    <Avatar.Image src={msg.sender.avatarUrl} />
                  )}
                </Avatar.Root>
              )}
              <MessageBubble
                msg={msg}
                isOwn={isOwn}
                isSpecialist={isSpecialist}
                onDeleteMessage={onDeleteMessage}
                onImageClick={onImageClick}
              />
            </Flex>
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </VStack>
  );
}
