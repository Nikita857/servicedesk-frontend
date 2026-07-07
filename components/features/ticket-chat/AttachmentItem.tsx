"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import {
  LuDownload,
  LuEye,
  LuFile,
  LuFileText,
  LuFileVideo,
  LuPlay,
} from "react-icons/lu";
import { attachmentApi } from "@/lib/api/attachments";
import { formatFileSize } from "@/lib/utils/formatters";
import { isImageType } from "@/lib/utils/fileValidation";
import type { MessageAttachment } from "@/types/message";
import { handleApiError } from "@/lib/utils";
import React from "react";

interface AttachmentItemProps {
  attachment: MessageAttachment;
  isOwn?: boolean;
  onImageClick?: (url: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isVideoType = (mimeType: string) => mimeType?.startsWith("video/");

const getFileExtension = (filename: string) =>
  filename.split(".").pop()?.toUpperCase() ?? "FILE";

const EXT_COLORS: Record<string, { bg: string; color: string }> = {
  PDF: { bg: "#fef2f2", color: "#ef4444" },
  DOCX: { bg: "#eff6ff", color: "#3b82f6" },
  DOC: { bg: "#eff6ff", color: "#3b82f6" },
  XLSX: { bg: "#f0fdf4", color: "#22c55e" },
  XLS: { bg: "#f0fdf4", color: "#22c55e" },
  PNG: { bg: "#faf5ff", color: "#a855f7" },
  JPG: { bg: "#faf5ff", color: "#a855f7" },
  JPEG: { bg: "#faf5ff", color: "#a855f7" },
  MP4: { bg: "#f0fdf4", color: "#22c55e" },
  MOV: { bg: "#f0fdf4", color: "#22c55e" },
};

const getExtColors = (ext: string) =>
  EXT_COLORS[ext] ?? { bg: "#f8fafc", color: "#64748b" };

const getFileIcon = (mimeType: string): React.ElementType => {
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return LuFileText;
  if (isVideoType(mimeType)) return LuFileVideo;
  return LuFile;
};

// ─── Image attachment ─────────────────────────────────────────────────────────

function ImageAttachment({
  attachment,
  isOwn,
  downloadUrl,
  isLoading,
  onImageClick,
  onDownload,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
  downloadUrl: string | null;
  isLoading: boolean;
  onImageClick?: (url: string) => void;
  onDownload: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (isLoading) {
    return (
      <Box
        w="100%"
        h="140px"
        bg={isOwn ? "whiteAlpha.200" : "bg.muted"}
        borderRadius="10px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="sm" color={isOwn ? "white" : "fg.muted"} />
      </Box>
    );
  }

  if (!downloadUrl) return null;

  return (
    <Box
      position="relative"
      w="fit-content"
      borderRadius="10px"
      overflow="hidden"
      cursor="pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) =>
        onImageClick ? onImageClick(downloadUrl) : onDownload(e)
      }
    >
      <Image
        src={downloadUrl}
        alt={attachment.filename}
        maxH="200px"
        maxW="100%"
        objectFit="cover"
        display="block"
        borderWidth="1px"
        borderColor={isOwn ? "whiteAlpha.300" : "border.subtle"}
        borderRadius="10px"
        style={{ transition: "opacity 0.15s" }}
        opacity={hovered ? 0.85 : 1}
      />
      {/* Hover overlay with download icon */}
      {hovered && (
        <Flex
          position="absolute"
          inset={0}
          align="center"
          justify="center"
          bg="blackAlpha.400"
          borderRadius="10px"
        >
          <Flex
            bg="whiteAlpha.300"
            backdropFilter="blur(4px)"
            borderRadius="full"
            p={2}
            color="white"
          >
            <LuEye size={18} />
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

// ─── Video attachment ─────────────────────────────────────────────────────────

function VideoAttachment({
  attachment,
  onDownload,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
  onDownload: (e: React.MouseEvent) => void;
}) {
  return (
    <Box
      position="relative"
      w="200px"
      h="120px"
      borderRadius="10px"
      overflow="hidden"
      cursor="pointer"
      bg="gray.900"
      onClick={onDownload}
    >
      {/* Play button */}
      <Flex
        w="100%"
        h="100%"
        align="center"
        justify="center"
        bg="blackAlpha.600"
      >
        <Flex
          w="40px"
          h="40px"
          borderRadius="full"
          bg="whiteAlpha.200"
          align="center"
          justify="center"
        >
          <LuPlay size={18} color="white" fill="white" />
        </Flex>
      </Flex>
      {/* Bottom meta */}
      <HStack
        position="absolute"
        bottom={1.5}
        left={2}
        right={2}
        justify="space-between"
      >
        <Text
          fontSize="10px"
          color="whiteAlpha.800"
          bg="blackAlpha.500"
          px={1.5}
          borderRadius="sm"
        >
          {formatFileSize(attachment.fileSize)}
        </Text>
        <Text
          fontSize="10px"
          color="whiteAlpha.800"
          bg="blackAlpha.500"
          px={1.5}
          borderRadius="sm"
        >
          {getFileExtension(attachment.filename)}
        </Text>
      </HStack>
    </Box>
  );
}

// ─── File attachment ──────────────────────────────────────────────────────────

function FileAttachment({
  attachment,
  isOwn,
  onDownload,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
  onDownload: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ext = getFileExtension(attachment.filename);
  const ec = getExtColors(ext);
  const iconType = getFileIcon(attachment.mimeType);
  // Resolved outside JSX to avoid "component created during render"
  const iconColor = isOwn ? "rgba(255,255,255,0.85)" : ec.color;

  return (
    <HStack
      gap={3}
      px={3}
      py={2.5}
      bg={
        hovered
          ? isOwn
            ? "whiteAlpha.300"
            : "bg.subtle"
          : isOwn
            ? "whiteAlpha.200"
            : "bg.surface"
      }
      borderRadius="10px"
      w="260px"
      maxW="100%"
      cursor="pointer"
      borderWidth="1px"
      borderColor={isOwn ? "whiteAlpha.200" : "border.default"}
      transition="all 0.15s"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onDownload}
    >
      {/* Icon with colored background */}
      <Flex
        w="36px"
        h="36px"
        borderRadius="8px"
        bg={isOwn ? "whiteAlpha.200" : ec.bg}
        align="center"
        justify="center"
        flexShrink={0}
      >
        {React.createElement(iconType, { size: 18, color: iconColor })}
      </Flex>

      {/* Name + meta */}
      <VStack gap={0.5} align="start" flex={1} overflow="hidden">
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={isOwn ? "white" : "fg.default"}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          w="100%"
          title={attachment.filename}
        >
          {attachment.filename}
        </Text>
        <HStack gap={1.5}>
          <Text
            fontSize="10px"
            fontWeight="semibold"
            color={isOwn ? "whiteAlpha.600" : ec.color}
            bg={isOwn ? "whiteAlpha.100" : ec.bg}
            px={1}
            borderRadius="3px"
          >
            {ext}
          </Text>
          <Text fontSize="xs" color={isOwn ? "whiteAlpha.600" : "fg.muted"}>
            {formatFileSize(attachment.fileSize)}
          </Text>
        </HStack>
      </VStack>

      {/* Download icon */}
      <Box
        color={
          hovered
            ? isOwn
              ? "white"
              : "accent.600"
            : isOwn
              ? "whiteAlpha.400"
              : "border.default"
        }
        transition="color 0.15s"
        flexShrink={0}
      >
        <LuDownload size={14} />
      </Box>
    </HStack>
  );
}

// ─── AttachmentItem (main export) ────────────────────────────────────────────

export function AttachmentItem({
  attachment,
  isOwn = false,
  onImageClick,
}: AttachmentItemProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isImageType(attachment.mimeType)) return;

    const fetchUrl = async () => {
      setIsLoading(true);
      try {
        const { downloadUrl } = await attachmentApi.getUrl(attachment.id);
        if (mounted) setDownloadUrl(downloadUrl);
      } catch (error) {
        console.error("Failed to load attachment URL", error);
      } finally {
        if (mounted) setIsLoading(false);
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
      const { downloadUrl: url } = await attachmentApi.getUrl(attachment.id);
      window.open(url, "_blank");
    } catch (error) {
      handleApiError(error);
    }
  };

  if (isImageType(attachment.mimeType)) {
    return (
      <ImageAttachment
        attachment={attachment}
        isOwn={isOwn}
        downloadUrl={downloadUrl}
        isLoading={isLoading}
        onImageClick={onImageClick}
        onDownload={handleDownload}
      />
    );
  }

  if (isVideoType(attachment.mimeType)) {
    return (
      <VideoAttachment
        attachment={attachment}
        isOwn={isOwn}
        onDownload={handleDownload}
      />
    );
  }

  return (
    <FileAttachment
      attachment={attachment}
      isOwn={isOwn}
      onDownload={handleDownload}
    />
  );
}
