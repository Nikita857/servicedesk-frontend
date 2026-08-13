"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, HStack, IconButton, Spinner, Text } from "@chakra-ui/react";
import { LuPanelLeftClose, LuSquarePen, LuTrash2 } from "react-icons/lu";
import { agentApi } from "@/lib/api/agent";
import { toast } from "@/lib/utils";
import type { AgentConversation } from "@/types/agent";
import { Tooltip } from "@/components/ui";

interface AgentConversationSidebarProps {
  /** Не нужен в variant="static" — там список всегда виден. */
  isOpen?: boolean;
  /** Не нужен в variant="static". */
  onClose?: () => void;
  activeConversationId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  /** Удаление ТЕКУЩЕГО открытого диалога — идёт через useAgentChat (гасит стрим). */
  onDeleteActive: () => Promise<void>;
  /**
   * overlay (по умолчанию) — выезжающая поверх контента панель для виджета.
   * static — постоянно видимая колонка для полноценной страницы чата.
   */
  variant?: "overlay" | "static";
}

const PAGE_SIZE = 50;

/** Начало суток для переданной даты — по локальному времени пользователя. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Время внутри сегодняшнего дня, для остальных — короткая дата без года. */
function formatStamp(iso: string, isToday: boolean): string {
  const date = new Date(iso);
  if (isToday) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

interface ConversationGroup {
  label: string;
  isToday: boolean;
  items: AgentConversation[];
}

/**
 * Группировка списка по дате последнего сообщения.
 *
 * Плоский список с полной датой у каждой строки («12.08.2026, 18:12») заставлял
 * читать даты, чтобы понять порядок. Заголовки групп делают ту же работу один
 * раз на группу, а в строке остаётся только время.
 */
function groupByDate(conversations: AgentConversation[]): ConversationGroup[] {
  const today = startOfDay(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;

  const groups: ConversationGroup[] = [
    { label: "Сегодня", isToday: true, items: [] },
    { label: "Вчера", isToday: false, items: [] },
    { label: "Ранее", isToday: false, items: [] },
  ];

  for (const conversation of conversations) {
    const day = startOfDay(new Date(conversation.updatedAt));
    if (day >= today) groups[0].items.push(conversation);
    else if (day >= yesterday) groups[1].items.push(conversation);
    else groups[2].items.push(conversation);
  }

  return groups.filter((group) => group.items.length > 0);
}

/**
 * Список диалогов ИИ-агента.
 *
 * В variant="overlay" абсолютно спозиционирован поверх AgentChatPanel (не
 * раздвигает виджет — тот держит фиксированные размеры), выезжает transform'ом
 * и прячется тем же способом обратно за левый край панели.
 * В variant="static" — обычная колонка в раскладке страницы, всегда открыта.
 */
export function AgentConversationSidebar({
  isOpen = true,
  onClose,
  activeConversationId,
  onSelect,
  onNewChat,
  onDeleteActive,
  variant = "overlay",
}: AgentConversationSidebarProps) {
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isStatic = variant === "static";

  // Список актуален только на момент открытия — новые диалоги/переименования
  // между открытиями сайдбара нас не волнуют, перечитываем при каждом показе.
  // В static-варианте список всегда открыт, перечитываем только при монтировании.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);
    agentApi
      .listConversations(0, PAGE_SIZE)
      .then((page) => {
        if (!cancelled) setConversations(page.content);
      })
      .catch((error) => {
        console.error("[Agent] не удалось загрузить список диалогов:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const groups = useMemo(() => groupByDate(conversations), [conversations]);

  const handleSelect = (id: number) => {
    if (id !== activeConversationId) onSelect(id);
    onClose?.();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose?.();
  };

  const handleDelete = async (
    event: React.MouseEvent,
    conversation: AgentConversation,
  ) => {
    event.stopPropagation();
    if (!confirm("Удалить этот диалог? Действие необратимо.")) return;

    try {
      if (conversation.id === activeConversationId) {
        await onDeleteActive();
      } else {
        await agentApi.deleteConversation(conversation.id);
      }
      setConversations((prev) =>
        prev.filter((item) => item.id !== conversation.id),
      );
    } catch (error) {
      console.error("[Agent] не удалось удалить диалог:", error);
      toast.error("ИИ-агент", "Не удалось удалить диалог");
    }
  };

  return (
    <>
      {/* Затемнение чата под сайдбаром — кликом тоже закрывает. В static-варианте не нужно: колонка не перекрывает контент. */}
      {!isStatic && (
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.400"
          opacity={isOpen ? 1 : 0}
          pointerEvents={isOpen ? "auto" : "none"}
          transition="opacity 0.2s ease"
          zIndex={1}
          onClick={onClose}
        />
      )}

      <Flex
        direction="column"
        position={isStatic ? "relative" : "absolute"}
        top={0}
        left={0}
        h="100%"
        w={isStatic ? "280px" : "78%"}
        maxW="280px"
        flexShrink={0}
        bg="bg.surface"
        borderRightWidth="1px"
        borderColor="border.default"
        boxShadow={isStatic ? "none" : "lg"}
        transform={isStatic || isOpen ? "translateX(0)" : "translateX(-100%)"}
        transition={isStatic ? undefined : "transform 0.2s ease"}
        zIndex={2}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={2}
          px={4}
          pt={4}
          pb={3.5}
          flexShrink={0}
        >
          <Text fontWeight="semibold" fontSize="15px" color="fg.default">
            Диалоги
          </Text>
          <HStack gap={1}>
            {/* Кнопка с подписью, а не безымянная иконка: это главное действие колонки */}
            <Button
              variant="outline"
              size="xs"
              h="32px"
              px={2.5}
              borderRadius="9px"
              borderColor="border.default"
              color="fg.default"
              fontSize="12.5px"
              fontWeight="semibold"
              onClick={handleNewChat}
            >
              <LuSquarePen size={14} />
              Новый
            </Button>
            {!isStatic && (
              <Tooltip content="Скрыть список">
                <IconButton
                  aria-label="Скрыть список диалогов"
                  variant="ghost"
                  w="32px"
                  h="32px"
                  minW="32px"
                  p={0}
                  borderRadius="9px"
                  color="fg.muted"
                  _hover={{ bg: "bg.subtle", color: "fg.default" }}
                  onClick={onClose}
                >
                  <LuPanelLeftClose />
                </IconButton>
              </Tooltip>
            )}
          </HStack>
        </Flex>

        {isLoading ? (
          <Flex align="center" justify="center" flex={1}>
            <Spinner size="md" color="fg.muted" />
          </Flex>
        ) : conversations.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            flex={1}
            px={4}
            textAlign="center"
          >
            <Text fontSize="13px" color="fg.muted">
              Диалогов пока нет
            </Text>
          </Flex>
        ) : (
          <Box flex={1} minH={0} overflowY="auto" px={2} pb={2}>
            {groups.map((group) => (
              <Box key={group.label}>
                <Text
                  px={2}
                  pt={2.5}
                  pb={1.5}
                  fontSize="11px"
                  fontWeight="semibold"
                  letterSpacing="0.05em"
                  textTransform="uppercase"
                  color="fg.subtle"
                >
                  {group.label}
                </Text>

                {group.items.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <Flex
                      key={conversation.id}
                      align="center"
                      justify="space-between"
                      gap={1}
                      px={2.5}
                      py={2}
                      borderRadius="9px"
                      cursor="pointer"
                      bg={isActive ? "bg.subtle" : "transparent"}
                      css={{ "& .row-delete": { opacity: 0 } }}
                      _hover={{
                        bg: "bg.subtle",
                        "& .row-delete": { opacity: 1 },
                      }}
                      onClick={() => handleSelect(conversation.id)}
                    >
                      <Box minW={0} flex={1}>
                        <Text
                          fontSize="13.5px"
                          fontWeight={isActive ? "semibold" : "medium"}
                          color="fg.default"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {conversation.title ?? "Без темы"}
                        </Text>
                        <Text fontSize="11.5px" color="fg.muted" mt="2px">
                          {formatStamp(conversation.updatedAt, group.isToday)}
                        </Text>
                      </Box>
                      <IconButton
                        className="row-delete"
                        aria-label="Удалить диалог"
                        variant="ghost"
                        w="26px"
                        h="26px"
                        minW="26px"
                        p={0}
                        borderRadius="7px"
                        color="fg.subtle"
                        transition="opacity 0.15s ease"
                        _hover={{ color: "red.500", bg: "bg.muted" }}
                        onClick={(event) =>
                          void handleDelete(event, conversation)
                        }
                      >
                        <LuTrash2 size={14} />
                      </IconButton>
                    </Flex>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}
      </Flex>
    </>
  );
}
