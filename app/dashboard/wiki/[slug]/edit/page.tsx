"use client";

import { useState, useEffect, use } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { LuArrowLeft, LuSave } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, type UpdateWikiArticleRequest } from "@/lib/api/wiki";
import { useWikiArticleQuery } from "@/lib/hooks";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";
import { AxiosError } from "axios";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditWikiArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  // Use TanStack Query for article data
  const { article, isLoading, error } = useWikiArticleQuery(slug);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
  });
  const [tagsInput, setTagsInput] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Initialize form when article loads
  useEffect(() => {
    if (article && !formInitialized) {
      setFormData({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || "",
        categoryId: article.categoryId || undefined,
      });
      setTagsInput(article.tags.join(", "));
      setFormInitialized(true);
    }
  }, [article, formInitialized]);

  // Error handling
  if (error) {
    toaster.error({
      title: "Ошибка",
      description: "Статья не найдена",
      closable: true,
    });
    router.push("/dashboard/wiki");
    return null;
  }

  // Check access
  useEffect(() => {
    if (!isLoading && article) {
      const isAuthor = user?.id === article.createdBy.id;
      const isAdmin = user?.roles.every((role) => role === "ADMIN");
      if (!isSpecialist) {
        toaster.error({
          title: "Доступ запрещён",
          description: "Вы можете редактировать только свои статьи",
          closable: true,
        });
        router.push(`/dashboard/wiki/${slug}`);
      }
      if (!isAuthor && !isAdmin) {
        toaster.error({
          title: "Доступ запрещён",
          description: "Вы не являетесь специалистом",
          closable: true,
        });
        router.push(`/dashboard/wiki/${slug}`);
      }
    }
  }, [isLoading, article, isSpecialist, user?.id, router, slug, user?.roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    if (!formData.title?.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите заголовок статьи",
        closable: true,
      });
      return;
    }

    if (!formData.content?.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите содержимое статьи",
        closable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const updated = await wikiApi.update(article.id, {
        ...formData,
        tags,
      });

      toaster.success({ title: "Статья обновлена!" });
      router.push(`/dashboard/wiki/${updated.slug}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toaster.error({
          title: "Ошибка",
          description: error.response?.data.message,
          closable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
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

  return (
    <Box maxW="900px" mx="auto">
      {/* Back button */}
      <Link href={`/dashboard/wiki/${slug}`}>
        <Button variant="ghost" size="sm" mb={4}>
          <LuArrowLeft />
          Назад к статье
        </Button>
      </Link>

      {/* Form */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={8}
      >
        <Heading size="lg" color="fg.default" mb={6}>
          Редактирование статьи
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack gap={5} align="stretch">
            {/* Title */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Заголовок *
              </Text>
              <Input
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Введите заголовок статьи"
                bg="bg.subtle"
                maxLength={250}
              />
            </Box>

            {/* Excerpt */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Краткое описание
              </Text>
              <Textarea
                value={formData.excerpt || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Краткое описание для превью (опционально)"
                bg="bg.subtle"
                rows={2}
                maxLength={500}
              />
            </Box>

            {/* Tags */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Теги
              </Text>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Введите теги через запятую"
                bg="bg.subtle"
              />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                Пример: инструкция, 1С, отчёты
              </Text>
            </Box>

            {/* Content */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Содержимое *
              </Text>
              <Textarea
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Напишите содержимое статьи..."
                bg="bg.subtle"
                rows={15}
                minH="300px"
              />
            </Box>

            {/* Submit */}
            <Flex justify="flex-end" gap={3} pt={4}>
              <Link href={`/dashboard/wiki/${slug}`}>
                <Button variant="outline">Отмена</Button>
              </Link>
              <Button
                type="submit"
                bg="gray.900"
                color="white"
                loading={isSubmitting}
                _hover={{ bg: "gray.800" }}
              >
                <LuSave />
                Сохранить
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
