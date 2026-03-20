"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  IconButton,
  VStack,
  HStack,
  Popover,
  Portal,
  Spinner,
  Button,
} from "@chakra-ui/react";
import {
  LuBell,
  LuMail,
  LuMailOpen,
  LuArrowRightLeft,
  LuUserPlus,
  LuStar,
  LuCalendar,
  LuCheckCheck,
  LuUserCheck,
  LuUserX,
  LuUsers,
  LuUserMinus,
  LuTrash2,
  LuTicketPlus,
  LuShield,
  LuShieldOff,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/hooks/notification/useNotifications";
import { SDPagination } from "@/components/ui/SDPagination";
import type { NotificationResponse, NotificationType } from "@/types";

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  MESSAGE: { icon: LuMail, color: "blue.500" },
  STATUS_CHANGE: { icon: LuArrowRightLeft, color: "orange.500" },
  ASSIGNMENT: { icon: LuUserPlus, color: "green.500" },
  RATING: { icon: LuStar, color: "yellow.500" },
  ESTIMATED_DATE: { icon: LuCalendar, color: "purple.500" },
  ASSIGNMENT_ACCEPTED: { icon: LuUserCheck, color: "green.500" },
  ASSIGNMENT_REJECTED: { icon: LuUserX, color: "red.500" },
  CO_EXECUTOR_ADDED: { icon: LuUsers, color: "green.500" },
  CO_EXECUTOR_REMOVED: { icon: LuUserMinus, color: "red.500" },
  TICKET_TAKEN: { icon: LuUserCheck, color: "green.500" },
  TICKET_CREATED: { icon: LuTicketPlus, color: "green.500" },
  SPECIALIST_ADDED_TO_LINE: { icon: LuShield, color: "green.500" },
  SPECIALIST_REMOVED_FROM_LINE: { icon: LuShieldOff, color: "red.500" },
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU");
}

export function NotificationBell() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const {
    listQuery,
    unreadCount,
    markAsReadMutation,
    markAllAsReadMutation,
    clearAllMutation,
  } = useNotifications(page, 7);
  const router = useRouter();

  const notifications = listQuery.data?.content ?? [];
  const count = unreadCount.data ?? 0;
  const pageInfo = listQuery.data?.page;

  const handleClick = (n: NotificationResponse) => {
    if (!n.read) markAsReadMutation.mutate(n.id);
    setOpen(false);
    if (n.ticketId) {
      router.push(`/dashboard/tickets/${n.ticketId}`);
    }
  };

  return (
    <Popover.Root positioning={{ placement: "bottom-end" }} open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Popover.Trigger asChild>
        <Box position="relative" display="inline-flex">
          <IconButton
            aria-label="Уведомления"
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: "bg.subtle", color: "fg.default" }}
            data-onboarding-id="onboarding-notifications"
          >
            <LuBell size={20} />
          </IconButton>
          {count > 0 && (
            <Box
              position="absolute"
              top="-1px"
              right="-1px"
              bg="red.500"
              color="white"
              borderRadius="full"
              fontSize="2xs"
              fontWeight="bold"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              lineHeight="1"
              pointerEvents="none"
            >
              {count > 99 ? "99+" : count}
            </Box>
          )}
        </Box>
      </Popover.Trigger>

      <Portal>
        <Popover.Positioner>
          <Popover.Content w="400px" bg="bg.surface" borderColor="border.default" shadow="lg">
            <Popover.Arrow />

            {/* Header */}
            <Flex px={4} py={3} align="center" justify="space-between" borderBottomWidth="1px" borderColor="border.default">
              <Text fontWeight="semibold" fontSize="sm">
                Уведомления
                {count > 0 && (
                  <Text as="span" color="fg.muted" fontWeight="normal" ml={1}>
                    ({count})
                  </Text>
                )}
              </Text>
              <HStack gap={1}>
                {count > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    fontSize="xs"
                    color="fg.muted"
                    _hover={{ color: "fg.default" }}
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    <LuCheckCheck size={14} />
                    Прочитать все
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    fontSize="xs"
                    color="fg.error"
                    _hover={{ color: "red.600" }}
                    onClick={() => clearAllMutation.mutate()}
                    disabled={clearAllMutation.isPending}
                  >
                    <LuTrash2 size={14} />
                    Очистить
                  </Button>
                )}
              </HStack>
            </Flex>

            {/* Body */}
            <Box overflowY="auto" maxH="400px">
              {listQuery.isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : notifications.length === 0 ? (
                <Flex direction="column" align="center" py={8} gap={2}>
                  <LuMailOpen size={32} color="var(--chakra-colors-fg-subtle)" />
                  <Text fontSize="sm" color="fg.muted">
                    Нет уведомлений
                  </Text>
                </Flex>
              ) : (
                <VStack gap={0} align="stretch">
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={() => handleClick(n)}
                    />
                  ))}
                </VStack>
              )}
            </Box>

            {/* Footer — pagination */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <Box borderTopWidth="1px" borderColor="border.default" pt={2} pb={1}>
                <SDPagination page={pageInfo} action={setPage} size="xs" />
              </Box>
            )}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationResponse;
  onClick: () => void;
}) {
  const config = typeConfig[notification.type] ?? typeConfig.MESSAGE;
  const Icon = config.icon;

  return (
    <Flex
      px={4}
      py={3}
      gap={3}
      cursor="pointer"
      align="flex-start"
      _hover={{ bg: "bg.subtle" }}
      bg={notification.read ? "transparent" : "bg.muted"}
      transition="background 0.15s"
      onClick={onClick}
    >
      {/* Icon */}
      <Box mt="2px" flexShrink={0} color={config.color}>
        <Icon size={18} />
      </Box>

      {/* Content */}
      <Box flex={1} minW={0}>
        <HStack justify="space-between" align="flex-start" gap={2}>
          <Text
            fontSize="sm"
            fontWeight={notification.read ? "normal" : "semibold"}
            color="fg.default"
            lineClamp={1}
          >
            {notification.title ?? notification.ticketTitle}
          </Text>
          {!notification.read && (
            <Box flexShrink={0} w="8px" h="8px" borderRadius="full" bg="blue.500" mt="6px" />
          )}
        </HStack>

        <Text fontSize="xs" color="fg.muted" lineClamp={2} mt={0.5}>
          {notification.body}
        </Text>

        <HStack mt={1} gap={2}>
          <Text fontSize="2xs" color="fg.subtle">
            {formatTimeAgo(notification.createdAt)}
          </Text>
          {notification.messageCount > 1 && (
            <Text fontSize="2xs" color="fg.subtle">
              +{notification.messageCount - 1} сообщ.
            </Text>
          )}
        </HStack>
      </Box>
    </Flex>
  );
}
