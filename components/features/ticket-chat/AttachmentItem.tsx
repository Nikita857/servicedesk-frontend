import { useState, useEffect } from "react";
import {
  Box,
  HStack,
  Image,
  Link,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { LuDownload, LuFile, LuFileText, LuFileVideo } from "react-icons/lu";
import { attachmentApi } from "@/lib/api/attachments"; // Fixed import
import { formatFileSize } from "@/lib/utils/formatters";
import { isImageType } from "@/lib/utils/fileValidation";
import type { MessageAttachment } from "@/types/message";
import { toaster } from "@/components/ui/toaster";

interface AttachmentItemProps {
  attachment: MessageAttachment;
  isOwn?: boolean;
}

const isVideoType = (mimeType: string) => mimeType?.startsWith("video/");

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return LuFileText;
  if (isVideoType(mimeType)) return LuFileVideo;
  return LuFile;
};

export function AttachmentItem({
  attachment,
  isOwn = false,
}: AttachmentItemProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch URL on mount or click?
  // For images we need it immediately. For files, we can fetch on click or immediately.
  // Given presigned URLs expire, fetching on click is safer for "Download", but for "View" (Image) we need it now.
  // The guide says "Для скачивания файла или отображения картинки нужно сначала получить временную ссылку".

  useEffect(() => {
    let mounted = true;

    const fetchUrl = async () => {
      // Only fetch immediately for images to show preview
      if (isImageType(attachment.mimeType)) {
        setIsLoading(true);
        try {
          const { downloadUrl } = await attachmentApi.getUrl(attachment.id);
          if (mounted) setDownloadUrl(downloadUrl);
        } catch (error) {
          console.error("Failed to load attachment URL", error);
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      mounted = false;
    };
  }, [attachment.id, attachment.mimeType]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Always fetch fresh URL for download action
      const { downloadUrl: url } = await attachmentApi.getUrl(attachment.id);
      window.open(url, "_blank");
    } catch {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось скачать файл",
      });
    }
  };

  if (isImageType(attachment.mimeType)) {
    if (isLoading) {
      return (
        <Box
          height="150px"
          width="200px"
          bg={isOwn ? "whiteAlpha.200" : "bg.muted"}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="sm" color={isOwn ? "white" : "fg.muted"} />
        </Box>
      );
    }

    if (!downloadUrl) {
      // Fallback or error state
      return null;
    }

    return (
      <Box onClick={handleDownload} display="block" cursor="pointer">
        <Image
          src={downloadUrl}
          alt={attachment.filename}
          maxH="200px"
          maxW="300px"
          borderRadius="md"
          objectFit="cover"
          borderWidth="1px"
          borderColor={isOwn ? "whiteAlpha.300" : "border.subtle"}
          _hover={{ opacity: 0.9 }}
        />
      </Box>
    );
  }

  return (
    <HStack
      onClick={handleDownload}
      p={2}
      bg={isOwn ? "whiteAlpha.200" : "bg.muted"}
      borderRadius="md"
      gap={3}
      cursor="pointer"
      maxW="280px"
      borderWidth="1px"
      borderColor="transparent"
      transition="all 0.2s"
      _hover={{
        bg: isOwn ? "whiteAlpha.300" : "bg.subtle",
        borderColor: isOwn ? "whiteAlpha.400" : "border.subtle",
      }}
    >
      <Box
        as={getFileIcon(attachment.mimeType)}
        boxSize={6}
        color={isOwn ? "white" : "fg.muted"}
        flexShrink={0}
      />
      <VStack gap={0} align="start" flex={1} overflow="hidden">
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={isOwn ? "white" : "fg.default"}
          truncate
          w="100%"
          title={attachment.filename}
        >
          {attachment.filename}
        </Text>
        <Text
          fontSize="xs"
          opacity={0.8}
          color={isOwn ? "whiteAlpha.800" : "fg.muted"}
        >
          {formatFileSize(attachment.fileSize)}
        </Text>
      </VStack>
      <Box
        as={LuDownload}
        boxSize={4}
        color={isOwn ? "whiteAlpha.800" : "fg.muted"}
        flexShrink={0}
      />
    </HStack>
  );
}
