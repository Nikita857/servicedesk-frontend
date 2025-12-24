"use client";

import { useState, use, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Badge,
  Link as ChakraLink,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuPencil,
  LuHeart,
  LuEye,
  LuUser,
  LuClock,
  LuTrash,
  LuDownload,
  LuFile,
  LuImage,
  LuFileText,
  LuVideo,
} from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, WikiAttachment } from "@/lib/api/wiki";
import { useWikiArticleQuery } from "@/lib/hooks";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";
import { getAttachmentDownloadUrl } from "@/lib/api/attachments";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get icon for file type
function getFileIcon(type: WikiAttachment["type"]) {
  switch (type) {
    case "PHOTO":
    case "SCREENSHOT":
      return LuImage;
    case "VIDEO":
      return LuVideo;
    case "DOCUMENT":
      return LuFileText;
    default:
      return LuFile;
  }
}

export default function WikiArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  // Use TanStack Query for article data
  const { article, isLoading, isLiking, handleLike, error } =
    useWikiArticleQuery(slug);

  const [isDeleting, setIsDeleting] = useState(false);
  const [attachments, setAttachments] = useState<WikiAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Load attachments when article is loaded
  useEffect(() => {
    if (article?.id) {
      setLoadingAttachments(true);
      wikiApi
        .getAttachments(article.id)
        .then(setAttachments)
        .catch(() => {
          // Silently fail - attachments are optional
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [article?.id]);

  // Redirect on error
  if (error) {
    toaster.error({
      title: "Ошибка",
      description: "Статья не найдена",
    });
    router.push("/dashboard/wiki");
    return null;
  }

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return;

    setIsDeleting(true);
    try {
      await wikiApi.delete(article.id);
      toaster.success({ title: "Статья удалена" });
      router.push("/dashboard/wiki");
    } catch {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось удалить статью",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!article) {
    return null;
  }

  const isAuthor = user?.id === article.createdBy.id;
  const canEdit =
    (isSpecialist && isAuthor) || user?.roles.every((role) => role === "ADMIN");

  return (
    <Box maxW="900px" mx="auto">
      {/* Back button */}
      <Link href="/dashboard/wiki">
        <Button variant="ghost" size="sm" mb={4}>
          <LuArrowLeft />
          Назад к списку
        </Button>
      </Link>

      {/* Article */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={8}
      >
        {/* Header */}
        <VStack align="stretch" gap={4} mb={6}>
          {/* Category & Tags */}
          <HStack gap={2} flexWrap="wrap">
            {article.categoryName && (
              <Badge colorPalette="purple" size="sm">
                {article.categoryName}
              </Badge>
            )}
            {article.tags.map((tag) => (
              <Badge key={tag} colorPalette="blue" variant="subtle" size="sm">
                {tag}
              </Badge>
            ))}
          </HStack>

          {/* Title */}
          <Heading size="xl" color="fg.default">
            {article.title}
          </Heading>

          {/* Meta */}
          <HStack gap={4} fontSize="sm" color="fg.muted" flexWrap="wrap">
            <HStack gap={1}>
              <LuUser size={14} />
              <Text>{article.createdBy.fio || article.createdBy.username}</Text>
            </HStack>
            <HStack gap={1}>
              <LuClock size={14} />
              <Text>{formatDate(article.createdAt)}</Text>
            </HStack>
            <HStack gap={1}>
              <LuEye size={14} />
              <Text>{article.viewCount} просмотров</Text>
            </HStack>
            <HStack gap={1}>
              <LuHeart size={14} />
              <Text>{article.likeCount} лайков</Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Content */}
        <Box
          className="article-content"
          color="fg.default"
          fontSize="md"
          lineHeight="1.8"
          whiteSpace="pre-wrap"
          mb={6}
        >
          {article.content}
        </Box>

        {/* Attachments Section */}
        {(attachments.length > 0 || loadingAttachments) && (
          <Box
            mb={6}
            p={4}
            bg="bg.subtle"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Text fontSize="sm" fontWeight="medium" color="fg.default" mb={3}>
              📎 Вложения ({attachments.length})
            </Text>

            {loadingAttachments ? (
              <Spinner size="sm" />
            ) : (
              <VStack align="stretch" gap={2}>
                {attachments.map((attachment) => {
                  const IconComponent = getFileIcon(attachment.type);
                  return (
                    <HStack
                      key={attachment.id}
                      justify="space-between"
                      bg="bg.surface"
                      px={3}
                      py={2}
                      borderRadius="md"
                    >
                      <HStack gap={2}>
                        <IconComponent size={16} />
                        <Text fontSize="sm">{attachment.filename}</Text>
                        <Text fontSize="xs" color="fg.muted">
                          ({formatFileSize(attachment.fileSize)})
                        </Text>
                      </HStack>
                      <ChakraLink
                        href={getAttachmentDownloadUrl(attachment.id)}
                        target="_blank"
                      >
                        <Button size="xs" variant="ghost">
                          <LuDownload size={14} />
                          Скачать
                        </Button>
                      </ChakraLink>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </Box>
        )}

        {/* Actions */}
        <Flex
          pt={4}
          borderTopWidth="1px"
          borderColor="border.default"
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={2}
        >
          <Button
            variant={article.likedByCurrentUser ? "solid" : "outline"}
            colorPalette={article.likedByCurrentUser ? "red" : "gray"}
            onClick={handleLike}
            loading={isLiking}
          >
            <LuHeart
              style={{
                fill: article.likedByCurrentUser ? "currentColor" : "none",
              }}
            />
            {article.likedByCurrentUser ? "В избранном" : "Нравится"} (
            {article.likeCount})
          </Button>
          <Link href={`${API_BASE_URL}/wiki/${article.slug}/download`}>
            <Button variant="ghost" aria-label="Скачать PDF версию статьи">
              <LuDownload />
            </Button>
          </Link>

          {canEdit && (
            <HStack gap={2}>
              <Link href={`/dashboard/wiki/${article.slug}/edit`}>
                <Button variant="outline">
                  <LuPencil />
                  Редактировать
                </Button>
              </Link>
              <Button
                variant="ghost"
                color="red.500"
                onClick={handleDelete}
                loading={isDeleting}
              >
                <LuTrash />
              </Button>
            </HStack>
          )}
        </Flex>

        {/* Updated info */}
        {article.updatedBy && article.updatedAt !== article.createdAt && (
          <Text fontSize="xs" color="fg.muted" mt={4}>
            Обновлено {formatDate(article.updatedAt)} пользователем{" "}
            {article.updatedBy.fio || article.updatedBy.username}
          </Text>
        )}
      </Box>
    </Box>
  );
}
