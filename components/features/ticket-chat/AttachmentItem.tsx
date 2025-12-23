import {
  Box,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuDownload, LuFile, LuFileText, LuFileVideo } from "react-icons/lu";
import { getAttachmentUrl } from "@/lib/api";
import { formatFileSize } from "@/lib/utils/formatters";
import { isImageType } from "@/lib/utils/fileValidation";
import type { MessageAttachment } from "@/types/message";

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

export function AttachmentItem({ attachment, isOwn = false }: AttachmentItemProps) {
  if (isImageType(attachment.mimeType)) {
    return (
      <Link
        href={getAttachmentUrl(attachment.url)}
        target="_blank"
        rel="noopener noreferrer"
        display="block"
      >
        <Image
          src={getAttachmentUrl(attachment.url)}
          alt={attachment.filename}
          maxH="200px"
          maxW="300px"
          borderRadius="md"
          objectFit="cover"
          cursor="pointer"
          borderWidth="1px"
          borderColor={isOwn ? "whiteAlpha.300" : "border.subtle"}
          _hover={{ opacity: 0.9 }}
        />
      </Link>
    );
  }

  return (
    <Link
      href={getAttachmentUrl(attachment.url)}
      download={attachment.filename}
      target="_blank"
      rel="noopener noreferrer"
      _hover={{ textDecoration: "none" }}
    >
      <HStack
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
    </Link>
  );
}