"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spinner } from "@chakra-ui/react";
import { useAnnouncementQuery } from "@/lib/hooks/announcements";
import { AnnouncementDialog } from "@/components/features/announcement";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Диплинк из уведомлений — сразу показывает объявление диалогом поверх списка.
export default function AnnouncementDeepLinkPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: announcement, isLoading } = useAnnouncementQuery(Number(id));

  if (isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <AnnouncementDialog
      announcement={announcement ?? null}
      onClose={() => router.push("/dashboard/announcements")}
    />
  );
}
