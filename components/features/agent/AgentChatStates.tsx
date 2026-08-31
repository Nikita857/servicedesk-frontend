"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useAgentDensity } from "./agentDensity";

/**
 * Пустое состояние и индикатор ожидания — общие для виджета и страницы.
 * Раньше и то, и другое было продублировано в AgentChatPanel и в page.tsx.
 */

export function AgentEmptyState() {
  const d = useAgentDensity();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100%"
      gap={1.5}
      textAlign="center"
      px={4}
    >
      <Text
        fontSize={d.emptyTitle}
        fontWeight="semibold"
        letterSpacing="-0.01em"
        color="fg.default"
      >
        Чем помочь?
      </Text>
      <Text
        fontSize={d.emptyText}
        lineHeight="1.5"
        color="fg.muted"
        maxW="380px"
      >
        Спрошу базу знаний, подскажу по заявкам и учётным записям
      </Text>
    </Flex>
  );
}

/**
 * «Думаю…» без спиннера: та же подпись автора, что у готового ответа, плюс
 * бегущая полоса на месте первой строки текста. Ответ не «подпрыгивает»,
 * когда приходит первый токен — меняется только содержимое строки.
 */
export function AgentThinkingIndicator() {
  const d = useAgentDensity();

  return (
    <Flex direction="column" gap={2}>
      <style>{`
        @keyframes agent-shimmer {
          0% { background-position: -220px 0; }
          100% { background-position: 220px 0; }
        }
      `}</style>
      <Flex align="center" gap={2}>
        <Text
          fontSize={d.label}
          fontWeight="semibold"
          letterSpacing="0.05em"
          textTransform="uppercase"
          color="fg.subtle"
        >
          ИИ-агент
        </Text>
        <Box h="1px" flex={1} bg="border.default" />
      </Flex>
      <Box
        w="140px"
        h="10px"
        borderRadius="5px"
        bgImage="linear-gradient(90deg, var(--chakra-colors-bg-subtle) 0%, var(--chakra-colors-bg-muted) 40%, var(--chakra-colors-bg-subtle) 80%)"
        bgSize="220px 100%"
        animation="agent-shimmer 1.4s linear infinite"
      />
    </Flex>
  );
}
