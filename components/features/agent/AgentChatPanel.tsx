"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { LuPanelLeftOpen, LuSquarePen, LuX } from "react-icons/lu";
import { useAgentChat } from "@/lib/hooks/agent-chat";
import { useAgentChatStore } from "@/stores/agentChatStore";
import { AgentChatInput } from "./AgentChatInput";
import { AgentMessageItem } from "./AgentMessageItem";
import { AgentConversationSidebar } from "./AgentConversationSidebar";
import {
  AgentChatHeader,
  AgentHeaderAction,
  AgentHeaderActions,
} from "./AgentChatHeader";
import { AgentEmptyState, AgentThinkingIndicator } from "./AgentChatStates";
import { AgentDensityProvider, useAgentDensity } from "./agentDensity";

interface AgentChatPanelProps {
  onClose: () => void;
}

/**
 * Начинка виджета ИИ-агента.
 *
 * Файл грузится через next/dynamic: react-markdown с плагинами не нужен на
 * страницах дашборда, пока виджет не открыли.
 *
 * Вся вёрстка чата — общая со страницей /dashboard/agent. Разница только в
 * плотности (density="compact") и в том, что список диалогов здесь выезжает
 * поверх панели, а не стоит колонкой.
 */
export default function AgentChatPanel({ onClose }: AgentChatPanelProps) {
  return (
    <AgentDensityProvider density="compact">
      <AgentChatPanelBody onClose={onClose} />
    </AgentDensityProvider>
  );
}

function AgentChatPanelBody({ onClose }: AgentChatPanelProps) {
  const d = useAgentDensity();
  const {
    messages,
    status,
    isLoading,
    isHistoryLoading,
    sendMessage,
    stop,
    loadHistory,
    resetConversation,
    switchConversation,
    deleteConversation,
    deleteMessage,
    title,
    renameConversation,
  } = useAgentChat();
  const { conversationId } = useAgentChatStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Во время стрима messages меняется на каждой дельте — лента едет за текстом
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, status]);

  return (
    <Box position="relative" h="100%" overflow="hidden">
      <Flex direction="column" h="100%" overflow="hidden">
        <AgentChatHeader
          title={title}
          canRename={conversationId !== null}
          onRename={(next) => void renameConversation(next)}
          subtitle="ИИ-агент Service Desk"
        >
          <AgentHeaderActions>
            <AgentHeaderAction
              label="Диалоги"
              onClick={() => setIsSidebarOpen(true)}
            >
              <LuPanelLeftOpen />
            </AgentHeaderAction>
            <AgentHeaderAction
              label="Новый диалог"
              onClick={() => void resetConversation()}
            >
              <LuSquarePen />
            </AgentHeaderAction>
            <AgentHeaderAction
              label="Закрыть чат"
              tone="strong"
              onClick={onClose}
            >
              <LuX />
            </AgentHeaderAction>
          </AgentHeaderActions>
        </AgentChatHeader>

        {isHistoryLoading ? (
          <Flex align="center" justify="center" flex={1}>
            <Spinner size="md" color="fg.muted" />
          </Flex>
        ) : (
          <Box
            ref={scrollRef}
            flex={1}
            minH={0}
            overflowY="auto"
            px={d.gutter}
            py={d.listPaddingY}
          >
            {messages.length === 0 ? (
              <AgentEmptyState />
            ) : (
              <Flex direction="column" gap={d.messageGap}>
                {messages.map((message) => (
                  <AgentMessageItem
                    key={message.id}
                    message={message}
                    onDelete={deleteMessage}
                  />
                ))}

                {/*
                  Индикатор живёт только до первого токена: как приходит дельта,
                  появляется само сообщение ассистента и статус меняется на streaming
                */}
                {status === "submitted" && <AgentThinkingIndicator />}
              </Flex>
            )}
          </Box>
        )}

        <AgentChatInput
          onSend={(text, files) => void sendMessage(text, files)}
          onStop={() => void stop()}
          isLoading={isLoading}
        />
      </Flex>

      <AgentConversationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeConversationId={conversationId}
        onSelect={(id) => void switchConversation(id)}
        onNewChat={() => void resetConversation()}
        onDeleteActive={deleteConversation}
      />
    </Box>
  );
}
