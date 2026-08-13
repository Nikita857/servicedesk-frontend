"use client";

import { useEffect, useRef, useState } from "react";
import { HStack, IconButton, Input, Text } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";

interface ConversationTitleProps {
  title: string | null;
  /** Пока диалог не создан (ни одного сообщения не отправлено), переименовывать нечего. */
  canRename: boolean;
  onRename: (title: string) => void;
  defaultTitle?: string;
  /** Любой размер: шапка передаёт значение из density-токенов. */
  fontSize?: string;
}

/** Название диалога: клик по тексту или карандашу превращает его в поле ввода. */
export function ConversationTitle({
  title,
  canRename,
  onRename,
  defaultTitle = "ИИ-агент Service Desk",
  fontSize = "14px",
}: ConversationTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (!canRename) return;
    setDraft(title ?? "");
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== title) onRename(trimmed);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        size="sm"
        h="28px"
        px={2}
        borderRadius="8px"
        fontSize={fontSize}
        fontWeight="semibold"
        value={draft}
        maxLength={250}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <HStack
      gap={1}
      flex={1}
      minW={0}
      css={{ "& .edit-trigger": { opacity: 0 } }}
      _hover={{ "& .edit-trigger": { opacity: 1 } }}
    >
      <Text
        fontWeight="semibold"
        fontSize={fontSize}
        lineHeight="1.25"
        letterSpacing="-0.01em"
        color="fg.default"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        cursor={canRename ? "pointer" : "default"}
        onClick={startEditing}
      >
        {title ?? defaultTitle}
      </Text>
      {canRename && (
        <IconButton
          className="edit-trigger"
          aria-label="Переименовать диалог"
          variant="ghost"
          w="20px"
          h="20px"
          minW="20px"
          p={0}
          borderRadius="6px"
          color="fg.subtle"
          flexShrink={0}
          transition="opacity 0.15s ease"
          onClick={startEditing}
        >
          <LuPencil size={12} />
        </IconButton>
      )}
    </HStack>
  );
}
