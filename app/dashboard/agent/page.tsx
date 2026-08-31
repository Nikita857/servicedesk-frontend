"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { useAgentChat } from "@/lib/hooks/agent-chat";
import { useAgentChatStore } from "@/stores/agentChatStore";
import { AGENT_ENABLED } from "@/lib/config";
import {
  AgentChatHeader,
  AgentChatInput,
  AgentConversationSidebar,
  AgentDensityProvider,
  AgentEmptyState,
  AgentHeaderAction,
  AgentHeaderActions,
  AgentMessageItem,
  AgentThinkingIndicator,
  useAgentDensity,
} from "@/components/features/agent";

/**
 * Полноэкранная страница чата с ИИ-агентом — тот же диалог и те же компоненты,
 * что и в плавающем виджете (общий conversationId в useAgentChatStore).
 * Отличия ровно два: density="comfortable" (крупнее текст, шире отступы,
 * колонка сообщений 760px) и постоянно видимый список диалогов.
 */
export default function AgentPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();

  useEffect(() => {
    if (isHydrated && (!AGENT_ENABLED || !has(PERM.AI_AGENT_USE))) {
      router.push("/dashboard");
    }
  }, [isHydrated, has, router]);

  if (!isHydrated || !AGENT_ENABLED || !has(PERM.AI_AGENT_USE)) return null;

  return (
    <AgentDensityProvider density="comfortable">
      <AgentPageBody />
    </AgentDensityProvider>
  );
}

function AgentPageBody() {
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Во время стрима messages меняется на каждой дельте — лента едет за текстом
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, status]);

  const subtitle =
    messages.length > 0
      ? `${messages.length} сообщений`
      : "ИИ-агент Service Desk";

  return (
    <Flex
      // Компенсируем padding контентной области дашборда (Header 60px + p={4|6}),
      // чтобы чат занимал всю доступную высоту вьюпорта одним блоком со своим скроллом.
      h={{ base: "calc(100vh - 92px)", md: "calc(100vh - 108px)" }}
      mx={{ base: -4, md: -6 }}
      my={{ base: -4, md: -6 }}
      borderWidth={{ base: 0, md: "1px" }}
      borderColor="border.default"
      borderRadius={{ base: 0, md: "xl" }}
      overflow="hidden"
      bg="bg.surface"
    >
      {isSidebarOpen && (
        <AgentConversationSidebar
          variant="static"
          activeConversationId={conversationId}
          onSelect={(id) => void switchConversation(id)}
          onNewChat={() => void resetConversation()}
          onDeleteActive={deleteConversation}
        />
      )}

      <Flex direction="column" flex={1} minW={0} overflow="hidden">
        <AgentChatHeader
          title={title}
          canRename={conversationId !== null}
          onRename={(next) => void renameConversation(next)}
          subtitle={subtitle}
        >
          <AgentHeaderActions>
            <AgentHeaderAction
              label={
                isSidebarOpen
                  ? "Скрыть список диалогов"
                  : "Показать список диалогов"
              }
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              {isSidebarOpen ? <LuPanelLeftClose /> : <LuPanelLeftOpen />}
            </AgentHeaderAction>
          </AgentHeaderActions>
        </AgentChatHeader>

        {isHistoryLoading ? (
          <Flex align="center" justify="center" flex={1}>
            <Spinner size="lg" color="fg.muted" />
          </Flex>
        ) : (
          <Box
            ref={scrollRef}
            flex={1}
            minH={0}
            overflowY="auto"
            px={{ base: 4, md: d.gutter }}
            py={d.listPaddingY}
          >
            {messages.length === 0 ? (
              <AgentEmptyState />
            ) : (
              <Flex
                direction="column"
                gap={d.messageGap}
                maxW={d.contentMaxW}
                mx="auto"
              >
                {messages.map((message) => (
                  <AgentMessageItem
                    key={message.id}
                    message={message}
                    onDelete={deleteMessage}
                  />
                ))}

                {status === "submitted" && <AgentThinkingIndicator />}
              </Flex>
            )}
          </Box>
        )}

        <Box maxW={d.contentMaxW} w="full" mx="auto">
          <AgentChatInput
            onSend={(text, files) => void sendMessage(text, files)}
            onStop={() => void stop()}
            isLoading={isLoading}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
