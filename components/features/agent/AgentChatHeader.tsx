"use client";

import type { ReactNode } from "react";
import { Box, Flex, HStack, IconButton, Text } from "@chakra-ui/react";
import { LuBot } from "react-icons/lu";
import { ConversationTitle } from "./ConversationTitle";
import { useAgentDensity } from "./agentDensity";
import { Tooltip } from "@/components/ui";

interface AgentChatHeaderProps {
  title: string | null;
  canRename: boolean;
  onRename: (title: string) => void;
  /** Вторая строка под названием: подпись продукта или счётчик сообщений. */
  subtitle?: string;
  /** Кнопки справа — оборачивайте в AgentHeaderActions. */
  children?: ReactNode;
}

/**
 * Шапка чата — одна и та же в виджете и на странице.
 *
 * Раньше каждая из двух реализаций собирала свой ряд одиночных ghost-кнопок:
 * иконки висели в строке без группировки и читались как случайный набор.
 * Здесь слева — опознавательный знак агента с названием диалога, справа —
 * ОДНА группа действий (AgentHeaderActions), внутри которой кнопки уже
 * прижаты друг к другу на общей подложке.
 */
export function AgentChatHeader({
  title,
  canRename,
  onRename,
  subtitle,
  children,
}: AgentChatHeaderProps) {
  const d = useAgentDensity();
  const iconSize = parseInt(d.avatar, 10) >= 32 ? 18 : 16;

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={2}
      px={d.gutter}
      py={3}
      borderBottomWidth="1px"
      borderColor="border.default"
      flexShrink={0}
    >
      <HStack gap={2.5} flex={1} minW={0}>
        <Flex
          w={d.avatar}
          h={d.avatar}
          borderRadius="lg"
          bg="fg.default"
          color="bg.surface"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <LuBot size={iconSize} />
        </Flex>
        <Box minW={0} flex={1}>
          <ConversationTitle
            title={title}
            canRename={canRename}
            onRename={onRename}
            fontSize={d.title}
          />
          {subtitle && (
            <Text fontSize={d.caption} color="fg.muted" mt="1px" truncate>
              {subtitle}
            </Text>
          )}
        </Box>
      </HStack>

      {children}
    </Flex>
  );
}

/** Общая подложка для кнопок шапки: собирает их в один визуальный блок. */
export function AgentHeaderActions({ children }: { children: ReactNode }) {
  return (
    <HStack gap={0.5} p={1} bg="bg.subtle" borderRadius="10px" flexShrink={0}>
      {children}
    </HStack>
  );
}

interface AgentHeaderActionProps {
  label: string;
  onClick: () => void;
  /** strong — приподнятая кнопка внутри группы (закрытие виджета). */
  tone?: "default" | "strong";
  children: ReactNode;
}

export function AgentHeaderAction({
  label,
  onClick,
  tone = "default",
  children,
}: AgentHeaderActionProps) {
  const d = useAgentDensity();

  return (
    <Tooltip content={label}>
      <IconButton
        aria-label={label}
        onClick={onClick}
        variant="ghost"
        w={d.iconButton}
        h={d.iconButton}
        minW={d.iconButton}
        p={0}
        borderRadius="7px"
        bg={tone === "strong" ? "bg.surface" : "transparent"}
        boxShadow={tone === "strong" ? "xs" : "none"}
        color={tone === "strong" ? "fg.default" : "fg.muted"}
        _hover={{ bg: "bg.surface", color: "fg.default" }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
