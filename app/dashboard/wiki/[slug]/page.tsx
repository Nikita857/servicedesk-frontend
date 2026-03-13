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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { wikiApi, WikiAttachment } from "@/lib/api/wiki";
import { attachmentApi } from "@/lib/api/attachments";
import { useWikiArticleQuery } from "@/lib/hooks";
import { useAuthStore } from "@/stores";
import { formatDate, toast, formatFileSize, handleApiError } from "@/lib/utils";
import { WikiContent } from "@/components/features/wiki";
import { API_BASE_URL } from "@/lib/config";
import { Tooltip } from "@/components/ui/tooltip";
import { BackButton } from "@/components/ui";

interface PageProps {
  params: Promise<{ slug: string }>;
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
    handleApiError(error);
    router.push("/dashboard/wiki");
    return null;
  }

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return;

    setIsDeleting(true);
    try {
      await wikiApi.delete(article.id);
      toast.success("Статья удалена");
      router.push("/dashboard/wiki");
    } catch (error) {
      handleApiError(error, { context: "Удалить статью" });
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
  const isAdmin = user?.roles?.includes("ADMIN") || false;
  // Админы могут редактировать любые статьи, специалисты - только свои
  const canEdit = isAdmin || (isSpecialist && isAuthor);

  return (
    <Box maxW="900px" mx="auto">
      {/* Back button */}
      <BackButton href="/dashboard/wiki" label="Назад к списку" mb={4} />

      {/* Article */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={{ base: 4, md: 8 }}
      >
        {/* Header */}
        <VStack align="stretch" gap={4} mb={6}>
          {article.categoryName && (
            <HStack>
              <Tooltip
                content={
                  article.departments?.length > 0
                    ? `Категория отделов: ${article.departments.map((d) => d.name).join(", ")}`
                    : "Общая категория"
                }
              >
                <Badge colorPalette="purple" size="sm">
                  {article.categoryName}
                </Badge>
              </Tooltip>
            </HStack>
          )}

          <VStack align="stretch" gap={2}>
            {/* Title */}
            <Heading size="xl" color="fg.default">
              {article.title}
            </Heading>

            {/* Tags (Moved under title) */}
            {article.tags.length > 0 && (
              <HStack gap={2} flexWrap="wrap">
                {article.tags.map((tag) => (
                  <Badge
                    key={tag}
                    colorPalette="blue"
                    variant="subtle"
                    size="sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </HStack>
            )}
          </VStack>

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
        <Box mb={6}>
          <WikiContent content={article.content} />
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
                    <Flex
                      key={attachment.id}
                      justify="space-between"
                      align={{ base: "start", sm: "center" }}
                      direction={{ base: "column", sm: "row" }}
                      gap={2}
                      bg="bg.surface"
                      px={3}
                      py={2}
                      borderRadius="md"
                    >
                      <HStack gap={2} minW={0} flex={1}>
                        <IconComponent size={16} style={{ flexShrink: 0 }} />
                        <Text fontSize="sm" truncate>
                          {attachment.filename}
                        </Text>
                        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                          ({formatFileSize(attachment.fileSize)})
                        </Text>
                      </HStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        flexShrink={0}
                        onClick={async () => {
                          try {
                            const { downloadUrl } = await attachmentApi.getUrl(
                              attachment.id
                            );
                            window.open(downloadUrl, "_blank");
                          } catch (error) {
                            handleApiError(error);
                          }
                        }}
                      >
                        <LuDownload size={14} />
                        Скачать
                      </Button>
                    </Flex>
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
          align={{ base: "stretch", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
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

          <HStack gap={2} justify={{ base: "flex-start", sm: "flex-end" }}>
            <Link href={`${API_BASE_URL}/wiki/${article.slug}/download`}>
              <Button variant="ghost" aria-label="Скачать PDF версию статьи">
                <LuDownload />
              </Button>
            </Link>
            {canEdit && (
              <>
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
              </>
            )}
          </HStack>
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
