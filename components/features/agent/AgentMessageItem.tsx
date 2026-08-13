"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { LuCheck, LuCopy, LuFileText, LuTrash2 } from "react-icons/lu";
import { AgentMarkdown } from "./AgentMarkdown";
import { useAgentDensity } from "./agentDensity";
import { isPersistedMessageId } from "@/lib/hooks/agent-chat/useAgentChat";
import { toast } from "@/lib/utils";
import type { AgentUiMessage } from "@/types/agent";

interface AgentMessageItemProps {
  message: AgentUiMessage;
  /** Undefined, пока сообщение не сохранено на бэке (см. isPersistedMessageId) — кнопка не показывается. */
  onDelete?: (id: string) => void;
}

/** Кнопка действия под сообщением: квадрат со скруглением, а не круглый ghost. */
function MessageAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const d = useAgentDensity();

  return (
    <IconButton
      aria-label={label}
      onClick={onClick}
      variant="ghost"
      w={d.iconButton}
      h={d.iconButton}
      minW={d.iconButton}
      p={0}
      borderRadius="8px"
      color="fg.subtle"
      _hover={{ color: danger ? "red.500" : "fg.default", bg: "bg.subtle" }}
    >
      {children}
    </IconButton>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <MessageAction
      label="Удалить сообщение"
      danger
      onClick={() => {
        if (confirm("Удалить это сообщение? Действие необратимо.")) onClick();
      }}
    >
      <LuTrash2 />
    </MessageAction>
  );
}

/** Сколько держим галочку «скопировано» перед возвратом к иконке копирования. */
const COPIED_RESET_MS = 2000;

/**
 * Фронт крутится по обычному http:// на LAN-адресе (не localhost) — это НЕ secure
 * context, и navigator.clipboard там просто отсутствует. execCommand — устаревший
 * API, но единственный рабочий способ скопировать текст в таких условиях.
 */
function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return succeeded;
}

function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ответ может закрыться раньше, чем истечёт таймер — иначе setState после размонтирования
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!copyViaExecCommand(text)) {
        throw new Error("execCommand('copy') вернул false");
      }
      setIsCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    } catch (error) {
      console.error("[Agent] не удалось скопировать ответ:", error);
      toast.error("ИИ-агент", "Не удалось скопировать текст");
    }
  };

  return (
    <MessageAction
      label={isCopied ? "Скопировано" : "Скопировать ответ"}
      onClick={() => void handleCopy()}
    >
      {isCopied ? <LuCheck /> : <LuCopy />}
    </MessageAction>
  );
}

/**
 * Одно сообщение треда.
 *
 * Пузырь есть только у пользователя: длинный ответ агента в сплошной плите
 * на всю ширину панели читается заметно хуже, чем плоским потоком.
 * Ответ агента подписан текстовым микро-заголовком вместо круглой аватарки
 * на каждом сообщении: у аватарки нет смысловой нагрузки (собеседник всегда
 * один), а вертикальный ритм она ломала, съедая 32px слева у каждого абзаца.
 */
export function AgentMessageItem({ message, onDelete }: AgentMessageItemProps) {
  const d = useAgentDensity();
  const canDelete = Boolean(onDelete) && isPersistedMessageId(message.id);

  if (message.role === "user") {
    return (
      <Flex direction="column" align="flex-end" gap={1}>
        <Box
          maxW={d.bubbleMaxW}
          px={4}
          py={2.5}
          bg="bg.subtle"
          color="fg.default"
          borderRadius={d.bubbleRadius}
          fontSize={d.body}
          lineHeight="1.55"
          wordBreak="break-word"
        >
          <AgentMarkdown content={message.content} />

          {/*
            Приложенные бланки. Ссылки на скачивание нет намеренно: файл пользователь
            только что выбрал у себя, показываем лишь факт вложения.
          */}
          {message.files?.map((file) => (
            <HStack
              key={file.id}
              gap={2}
              mt={2}
              px={2.5}
              py={1.5}
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="md"
              bg="bg.canvas"
            >
              <Box color="fg.muted" display="flex" flexShrink={0}>
                <LuFileText size={14} />
              </Box>
              <Box fontSize={d.caption} color="fg.muted" minW={0} truncate>
                {file.filename}
              </Box>
            </HStack>
          ))}
        </Box>
        <HStack gap={1}>
          <CopyButton text={message.content} />
          {canDelete && <DeleteButton onClick={() => onDelete!(message.id)} />}
        </HStack>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={2}>
      {/* Подпись автора: капслок-метка и волосяная линия до правого края */}
      <Flex align="center" gap={2}>
        <Text
          fontSize={d.label}
          fontWeight="semibold"
          letterSpacing="0.05em"
          textTransform="uppercase"
          color="fg.subtle"
          flexShrink={0}
        >
          ИИ-агент
        </Text>
        <Box h="1px" flex={1} bg="border.default" />
      </Flex>

      {/* minW=0 обязателен: без него длинное слово или таблица распирают строку */}
      <Box
        fontSize={d.body}
        lineHeight="1.65"
        color="fg.default"
        wordBreak="break-word"
        minW={0}
      >
        <AgentMarkdown content={message.content} />
      </Box>

      <HStack gap={1}>
        <CopyButton text={message.content} />
        {canDelete && <DeleteButton onClick={() => onDelete!(message.id)} />}
      </HStack>
    </Flex>
  );
}
