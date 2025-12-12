"use client";

import { useState, useEffect, use } from "react";
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
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuEdit,
  LuHeart,
  LuEye,
  LuUser,
  LuClock,
  LuTrash,
} from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, type WikiArticle } from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function WikiArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await wikiApi.getBySlug(slug);
        setArticle(data);
      } catch (error) {
        console.error("Failed to load article", error);
        toaster.error({
          title: "Ошибка",
          description: "Статья не найдена",
        });
        router.push("/dashboard/wiki");
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [slug, router]);

  const handleLike = async () => {
    if (!article) return;
    setIsLiking(true);
    try {
      await wikiApi.like(article.id);
      setArticle((prev) =>
        prev ? { ...prev, likeCount: prev.likeCount + 1 } : null
      );
      toaster.success({ title: "Спасибо за отзыв!" });
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось поставить лайк",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return;

    setIsDeleting(true);
    try {
      await wikiApi.delete(article.id);
      toaster.success({ title: "Статья удалена" });
      router.push("/dashboard/wiki");
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось удалить статью",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
  const canEdit = isSpecialist && isAuthor;

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
          <Button variant="outline" onClick={handleLike} loading={isLiking}>
            <LuHeart />
            Нравится ({article.likeCount})
          </Button>

          {canEdit && (
            <HStack gap={2}>
              <Link href={`/dashboard/wiki/${article.slug}/edit`}>
                <Button variant="outline">
                  <LuEdit />
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
