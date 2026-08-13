"use client";

import { useState } from "react";
import { Box, Flex, Heading, Text, VStack, Spinner } from "@chakra-ui/react";
import { LuMegaphone } from "react-icons/lu";
import { useMyAnnouncementsQuery } from "@/lib/hooks/announcements";
import {
  AnnouncementCard,
  AnnouncementDialog,
} from "@/components/features/announcement";
import type { MyAnnouncementResponse } from "@/types/announcement";
import { SDPagination } from "@/components/ui/SDPagination";

export default function AnnouncementsPage() {
  const [page, setPage] = useState(0);
  const {
    data: announcements,
    isLoading,
    isPlaceholderData,
  } = useMyAnnouncementsQuery(page);
  const [selected, setSelected] = useState<MyAnnouncementResponse | null>(null);

  return (
    <Box maxW="720px" mx="auto">
      <Heading size="lg" color="fg.default" mb={6}>
        Объявления
      </Heading>

      {isLoading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" />
        </Flex>
      ) : !announcements || announcements.page.totalElements === 0 ? (
        <Flex direction="column" align="center" py={16} gap={3}>
          <LuMegaphone size={32} color="var(--chakra-colors-fg-subtle)" />
          <Text color="fg.muted">Объявлений пока нет</Text>
        </Flex>
      ) : (
        <>
          <VStack
            align="stretch"
            gap={3}
            mb={3}
            opacity={isPlaceholderData ? 0.6 : 1}
          >
            {announcements.content.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onClick={() => setSelected(announcement)}
              />
            ))}
          </VStack>
        </>
      )}
      <Box
        position="sticky"
        bottom={0}
        bg="bg.default"
        borderTopWidth="1px"
        borderColor="border.default"
        py={3}
        mt={4}
        zIndex="docked"
      >
        <SDPagination page={announcements?.page} size="sm" action={setPage} />
      </Box>
      <AnnouncementDialog
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
