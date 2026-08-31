"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Heading, Text, Button, Badge, HStack, VStack, Spinner } from "@chakra-ui/react";
import { LuPlus, LuArchive, LuTrash2 } from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { useAnnouncementsQuery, useArchiveAnnouncement, useDeleteAnnouncement } from "@/lib/hooks/announcements";
import { SDPagination } from "@/components/ui/SDPagination";
import type { AnnouncementManagementResponse } from "@/types/announcement";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();
  const [page, setPage] = useState(0);

  const announcementsQuery = useAnnouncementsQuery(page);
  const archiveMutation = useArchiveAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  useEffect(() => {
    if (isHydrated && !has(PERM.ANNOUNCEMENT_MANAGE)) {
      router.push("/dashboard");
    }
  }, [isHydrated, has, router]);

  if (!isHydrated || !has(PERM.ANNOUNCEMENT_MANAGE)) return null;

  const announcements = announcementsQuery.data?.content ?? [];
  const pageInfo = announcementsQuery.data?.page;

  return (
    <Box maxW="900px" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="fg.default">
          Объявления
        </Heading>
        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => router.push("/dashboard/admin/announcements/new")}
        >
          <LuPlus /> Создать объявление
        </Button>
      </Flex>

      {announcementsQuery.isLoading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" />
        </Flex>
      ) : announcements.length === 0 ? (
        <Text color="fg.muted" textAlign="center" py={16}>
          Объявлений пока нет
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          {announcements.map((announcement) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              onArchive={() => archiveMutation.mutate(announcement.id)}
              onDelete={() => deleteMutation.mutate(announcement.id)}
            />
          ))}
        </VStack>
      )}

      {pageInfo && pageInfo.totalPages > 1 && (
        <Box mt={4}>
          <SDPagination page={pageInfo} action={setPage} size="sm" />
        </Box>
      )}
    </Box>
  );
}

function AnnouncementRow({
  announcement,
  onArchive,
  onDelete,
}: {
  announcement: AnnouncementManagementResponse;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const isArchived =
    announcement.archivedAt !== null ||
    (announcement.expiresAt !== null && new Date(announcement.expiresAt) < new Date());
  const targets = announcement.broadcastAll
    ? ["Все пользователи"]
    : [...announcement.targetDepartmentNames, ...announcement.targetUserNames];

  return (
    <Box
      bg={isArchived ? "bg.muted" : "bg.surface"}
      opacity={isArchived ? 0.7 : 1}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex={1} minW={0}>
          <HStack gap={2} mb={1}>
            <Text fontWeight="semibold" color="fg.default">
              {announcement.title}
            </Text>
            {isArchived && <Badge colorPalette="gray">Архивировано</Badge>}
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            {announcement.totalRead} из {announcement.totalRecipients} прочитали
          </Text>
          {targets.length > 0 && (
            <Text fontSize="xs" color="fg.subtle" mt={1} lineClamp={1}>
              Кому: {targets.join(", ")}
            </Text>
          )}
          {announcement.expiresAt && (
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              До {new Date(announcement.expiresAt).toLocaleString("ru-RU")}
            </Text>
          )}
        </Box>
        <HStack gap={1} flexShrink={0}>
          {!isArchived && (
            <Button size="xs" variant="outline" onClick={onArchive}>
              <LuArchive /> Архивировать
            </Button>
          )}
          <Button size="xs" variant="outline" colorPalette="red" onClick={onDelete}>
            <LuTrash2 /> Удалить
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
