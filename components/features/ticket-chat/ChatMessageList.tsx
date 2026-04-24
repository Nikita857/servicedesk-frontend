"use client";

import { useRef, useEffect, ReactNode, useState } from "react";
import { Box, Flex, Text, VStack, Badge, Portal } from "@chakra-ui/react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

const linkifyText = (text: string, isOwn: boolean): ReactNode[] =>
  text.split(URL_REGEX).map((part, index) => {
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

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  isSpecialist: boolean;
  isGroupStart: boolean;
  /** True when this is the last message in a consecutive group from same sender */
  isGroupEnd: boolean;
  onDeleteMessage?: (messageId: number) => void;
  onImageClick?: (url: string) => void;
}

function MessageBubble({
  msg,
  isOwn,
  isSpecialist,
  isGroupStart,
  isGroupEnd,
  onDeleteMessage,
  onImageClick,
}: MessageBubbleProps) {
  const senderConf = getSenderConfig(msg.senderType);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const canDelete = isOwn && isSpecialist && !!onDeleteMessage;

  const handleContextMenu = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection?.toString().trim()) return;
    if (!canDelete) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const isRead = isSpecialist ? msg.readByUser : msg.readBySpecialist;

  return (
    <>
      <Box
        maxW={{ base: "65%", md: "60%" }}
        // Telegram-style: flat bottom corner on the "tail" side
        borderRadius="14px"
        borderBottomRightRadius={isOwn ? (isGroupEnd ? "3px" : "14px") : "14px"}
        borderBottomLeftRadius={isOwn ? "14px" : isGroupEnd ? "3px" : "14px"}
        bg={isOwn ? "accent.800" : "bg.subtle"}
        color={isOwn ? "white" : "fg.default"}
        px={3}
        py={2}
        mb={2}
        userSelect="text"
        onContextMenu={handleContextMenu}
      >
        {/* Sender name — only on group start for received messages */}
        {!isOwn && isGroupStart && (
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={`${senderConf.color}.600`}
            mb={0.5}
          >
            {msg.sender.fio || msg.sender.username}
          </Text>
        )}

        {/* Internal badge */}
        {msg.internal && (
          <Badge colorPalette="orange" variant="subtle" size="sm" mb={1}>
            Внутреннее
          </Badge>
        )}

        {/* Message content + inline time stitched together */}
        <Flex align="flex-end" gap={2} wrap="wrap">
          <Text
            fontSize="sm"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            userSelect="text"
            cursor="text"
            flex="1"
            minW="0"
          >
            {linkifyText(msg.content, isOwn)}
          </Text>

          {/* Time + status — inline, bottom-right, never wraps alone */}
          <Flex
            align="center"
            gap="3px"
            flexShrink={0}
            opacity={0.65}
            mb="-1px" // optical alignment with text baseline
          >
            {msg.edited && <Text fontSize="10px">изм.</Text>}
            <Text fontSize="10px" whiteSpace="nowrap">
              {formatTime(msg.createdAt)}
            </Text>
            {isOwn &&
              (isRead ? (
                <LuCheckCheck size={13} style={{ color: "#93c5fd" }} />
              ) : (
                <LuCheck size={13} />
              ))}
          </Flex>
        </Flex>

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
      </Box>

      {/* Context menu */}
      {menuPos && canDelete && (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            zIndex={1000}
            onClick={() => setMenuPos(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuPos(null);
            }}
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
            <Flex
              px={3}
              py={2}
              gap={2}
              align="center"
              cursor="pointer"
              _hover={{ bg: "bg.subtle" }}
              fontSize="sm"
              color="fg.error"
              onClick={() => {
                onDeleteMessage!(msg.id);
                setMenuPos(null);
              }}
            >
              <LuTrash2 size={14} />
              Удалить
            </Flex>
          </Box>
        </Portal>
      )}
    </>
  );
}

// ─── ChatMessageList ──────────────────────────────────────────────────────────

export function ChatMessageList({
  messages,
  currentUserId,
  isSpecialist,
  isLoading,
  onDeleteMessage,
  onImageClick,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100%">
        <Box w={6} h={6} borderRadius="full" bg="accent.600" opacity={0.3} />
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
    <VStack gap={0} align="stretch">
      {messages.map((msg, index) => {
        const isOwn = msg.sender.id === currentUserId;
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const showDateLabel =
          index === 0 ||
          formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);

        // Group logic: same sender = same group
        const isGroupStart =
          index === 0 || prevMsg.sender.id !== msg.sender.id || showDateLabel;

        const isGroupEnd =
          index === messages.length - 1 ||
          nextMsg.sender.id !== msg.sender.id ||
          formatDate(nextMsg.createdAt) !== formatDate(msg.createdAt);

        return (
          <Box key={msg.id} mt={isGroupStart ? 2 : "2px"}>
            {/* Date separator */}
            {showDateLabel && (
              <Flex justify="center" my={3}>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  bg="bg.subtle"
                  px={3}
                  py={0.5}
                  borderRadius="full"
                  fontWeight="medium"
                >
                  {formatDate(msg.createdAt)}
                </Text>
              </Flex>
            )}
            <Flex justify={isOwn ? "flex-end" : "flex-start"}>
              <MessageBubble
                msg={msg}
                isOwn={isOwn}
                isSpecialist={isSpecialist}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
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
