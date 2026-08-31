"use client";

import { Box, Flex, Text, Badge, HStack } from "@chakra-ui/react";
import type { MyAnnouncementResponse } from "@/types/announcement";

interface AnnouncementCardProps {
  announcement: MyAnnouncementResponse;
  onClick: () => void;
}

// Архивные/истёкшие карточки нарочно приглушены — отличать их от активных с первого взгляда.
export function AnnouncementCard({ announcement, onClick }: AnnouncementCardProps) {
  const { title, body, expiresAt, read, expired } = announcement;

  return (
    <Box
      bg={expired ? "bg.muted" : "bg.surface"}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={!expired && !read ? "purple.400" : "border.default"}
      opacity={expired ? 0.7 : 1}
      p={5}
      cursor="pointer"
      _hover={{ borderColor: expired ? "border.default" : "accent.500" }}
      transition="border-color 0.15s, opacity 0.15s"
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" color="fg.default" mb={1}>
            {title}
          </Text>
          <Text fontSize="sm" color="fg.muted" lineClamp={2}>
            {body}
          </Text>
        </Box>
        <HStack gap={2} flexShrink={0}>
          {expired ? (
            <Badge colorPalette="gray">Архивировано</Badge>
          ) : read ? (
            <Badge colorPalette="green">Прочитано</Badge>
          ) : (
            <Badge colorPalette="purple">Новое</Badge>
          )}
        </HStack>
      </Flex>
      {expiresAt && (
        <Text fontSize="xs" color="fg.subtle" mt={3}>
          {expired ? "Истекло" : "До"} {new Date(expiresAt).toLocaleString("ru-RU")}
        </Text>
      )}
    </Box>
  );
}
