"use client";

import { useState, useEffect, use, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  VStack,
  HStack,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { LuSave, LuPaperclip, LuX, LuFile, LuTrash } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  wikiApi,
  type UpdateWikiArticleRequest,
  type WikiAttachment,
} from "@/lib/api/wiki";
import { attachmentApi } from "@/lib/api/attachments";
import { useAuthStore } from "@/stores";
import { toast, formatFileSize, handleApiError } from "@/lib/utils";
import { WikiEditor } from "@/components/features/wiki";
import {
  useWikiCategoriesQuery,
  useWikiArticleQuery,
  useFileUpload,
} from "@/lib/hooks";
import { BackButton } from "@/components/ui";
import { createListCollection } from "@chakra-ui/react";
import { Select, Portal } from "@chakra-ui/react";
import { useMemo } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditWikiArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFileUpload();

  // Use TanStack Query for article data
  const { article, isLoading, error, refetch } = useWikiArticleQuery(slug);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
    categoryId: undefined,
  });
  const [tagsInput, setTagsInput] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Attachments state
  const [existingAttachments, setExistingAttachments] = useState<
    WikiAttachment[]
  >([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    number | null
  >(null);

  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } =
    useWikiCategoriesQuery();

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: categories.map((c) => ({
          label: c.name,
          value: c.id.toString(),
        })),
      }),
    [categories]
  );

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

  // Load existing attachments
  useEffect(() => {
    if (article?.id) {
      setLoadingAttachments(true);
      wikiApi
        .getAttachments(article.id)
        .then(setExistingAttachments)
        .catch(() => {
          // Silently fail - attachments are optional
        })
        .finally(() => setLoadingAttachments(false));
    }
  }, [article?.id]);

  // Error handling
  if (error) {
    handleApiError(error);
    router.push("/dashboard/wiki");
    return null;
  }

  // Check access
  useEffect(() => {
    if (!isLoading && article) {
      const isAuthor = user?.id === article.createdBy.id;
      const isAdmin = user?.roles.every((role) => role === "ADMIN");
      if (!isSpecialist) {
        toast.error(
          "Доступ запрещён",
          "Вы можете редактировать только свои статьи"
        );
        router.push(`/dashboard/wiki/${slug}`);
      }
      if (!isAuthor && !isAdmin) {
        toast.error("Доступ запрещён", "Вы не являетесь специалистом");
        router.push(`/dashboard/wiki/${slug}`);
      }
    }
  }, [isLoading, article, isSpecialist, user?.id, router, slug, user?.roles]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove new file from selection
  const handleRemoveNewFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Delete existing attachment
  const handleDeleteAttachment = async (attachmentId: number) => {
    setDeletingAttachmentId(attachmentId);
    try {
      await attachmentApi.delete(attachmentId);
      setExistingAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentId)
      );
      toast.success("Вложение удалено");
    } catch (error) {
      handleApiError(error, { context: "Удалить вложение" });
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    if (!formData.title?.trim()) {
      toast.error("Ошибка", "Введите заголовок статьи");
      return;
    }

    if (!formData.content?.trim()) {
      toast.error("Ошибка", "Введите содержимое статьи");
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

      // Upload new attachments if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) =>
          upload(file, "WIKI_ARTICLE", article.id)
        );

        try {
          await Promise.all(uploadPromises);
          toast.success(
            "Статья обновлена!",
            `Загружено ${selectedFiles.length} вложений`
          );
        } catch (uploadError) {
          toast.warning(
            "Статья обновлена",
            "Некоторые файлы не удалось загрузить"
          );
        }
      } else {
        toast.success("Статья обновлена!");
      }

      router.push(`/dashboard/wiki/${updated.slug}`);
    } catch (error) {
      handleApiError(error, { context: "обновить статью" });
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
      <BackButton
        href={`/dashboard/wiki/${slug}`}
        label="Назад к статье"
        mb={4}
      />

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

            {/* Category */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Категория
              </Text>
              <Select.Root
                collection={categoryCollection}
                value={
                  formData.categoryId ? [formData.categoryId.toString()] : []
                }
                onValueChange={(details) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: parseInt(details.value[0]),
                  }))
                }
                disabled={loadingCategories}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Выберите категорию" />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {categoryCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
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
              <WikiEditor
                value={formData.content || ""}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Напишите содержимое статьи..."
                height="400px"
              />
            </Box>

            {/* Attachments Section */}
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium" color="fg.default">
                Вложения
              </Text>

              {/* Existing attachments */}
              {loadingAttachments ? (
                <Flex py={4} justify="center">
                  <Spinner size="sm" />
                </Flex>
              ) : existingAttachments.length > 0 ? (
                <VStack align="stretch" gap={2} mb={4}>
                  <Text fontSize="xs" color="fg.muted" mb={1}>
                    Текущие вложения:
                  </Text>
                  {existingAttachments.map((attachment) => (
                    <HStack
                      key={attachment.id}
                      bg="bg.subtle"
                      px={3}
                      py={2}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack gap={2}>
                        <LuFile size={16} />
                        <Text fontSize="sm" truncate maxW="300px">
                          {attachment.filename}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          ({formatFileSize(attachment.fileSize)})
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Удалить вложение"
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        loading={deletingAttachmentId === attachment.id}
                      >
                        <LuTrash />
                      </IconButton>
                    </HStack>
                  ))}
                </VStack>
              ) : null}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              />

              {/* Upload button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                mb={3}
              >
                <LuPaperclip />
                Добавить файлы
              </Button>

              {/* New files list */}
              {selectedFiles.length > 0 && (
                <VStack align="stretch" gap={2}>
                  <Text fontSize="xs" color="fg.muted" mb={1}>
                    Новые файлы для загрузки:
                  </Text>
                  {selectedFiles.map((file, index) => (
                    <HStack
                      key={`${file.name}-${index}`}
                      bg="green.subtle"
                      px={3}
                      py={2}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack gap={2}>
                        <LuFile size={16} />
                        <Text fontSize="sm" truncate maxW="300px">
                          {file.name}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          ({formatFileSize(file.size)})
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Удалить файл"
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleRemoveNewFile(index)}
                      >
                        <LuX />
                      </IconButton>
                    </HStack>
                  ))}
                  <Text fontSize="xs" color="green.600">
                    {selectedFiles.length} файл(ов) будет загружено
                  </Text>
                </VStack>
              )}
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
