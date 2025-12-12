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
import {
  wikiApi,
  type WikiArticle,
  type UpdateWikiArticleRequest,
} from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditWikiArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
  });
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await wikiApi.getBySlug(slug);
        setArticle(data);
        setFormData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || "",
          categoryId: data.categoryId || undefined,
        });
        setTagsInput(data.tags.join(", "));
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

  // Check access
  useEffect(() => {
    if (!isLoading && article) {
      const isAuthor = user?.id === article.createdBy.id;
      if (!isSpecialist || !isAuthor) {
        toaster.error({
          title: "Доступ запрещён",
          description: "Вы можете редактировать только свои статьи",
        });
        router.push(`/dashboard/wiki/${slug}`);
      }
    }
  }, [isLoading, article, isSpecialist, user?.id, router, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    if (!formData.title?.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите заголовок статьи",
      });
      return;
    }

    if (!formData.content?.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите содержимое статьи",
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
      toaster.error({
        title: "Ошибка",
        description: "Не удалось обновить статью",
        closable: true,
      });
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
