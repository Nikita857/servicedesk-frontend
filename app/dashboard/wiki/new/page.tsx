"use client";

import { useState, useEffect, useRef, useMemo } from "react";

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
  IconButton,
} from "@chakra-ui/react";
import { LuSave, LuPaperclip, LuX, LuFile } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, type CreateWikiArticleRequest } from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { toast, formatFileSize, handleApiError } from "@/lib/utils";
import { WikiEditor } from "@/components/features/wiki";
import { useWikiCategoriesQuery, useFileUpload } from "@/lib/hooks";
import { BackButton } from "@/components/ui";
import { createListCollection } from "@chakra-ui/react";
import { Select, Portal } from "@chakra-ui/react";

export default function NewWikiArticlePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload } = useFileUpload();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
    categoryId: undefined,
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

  // Redirect non-specialists
  useEffect(() => {
    if (!isSpecialist) {
      toast.error(
        "Доступ запрещён",
        "Только специалисты могут создавать статьи"
      );
      router.push("/dashboard/wiki");
    }
  }, [isSpecialist, router]);

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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Ошибка", "Введите заголовок статьи");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Ошибка", "Введите содержимое статьи");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Create article first
      const article = await wikiApi.create({
        ...formData,
        tags,
      });

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) =>
          upload(file, "WIKI_ARTICLE", article.id)
        );

        try {
          await Promise.all(uploadPromises);
          toast.success(
            "Статья опубликована!",
            `Загружено ${selectedFiles.length} вложений`
          );
        } catch (uploadError) {
          toast.warning(
            "Статья создана",
            "Некоторые файлы не удалось загрузить"
          );
        }
      } else {
        toast.success("Статья опубликована!");
      }

      router.push(`/dashboard/wiki/${article.slug}`);
    } catch (error) {
      handleApiError(error, { context: "создать статью" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSpecialist) {
    return null;
  }

  return (
    <Box maxW="900px" mx="auto">
      {/* Back button */}
      <BackButton href="/dashboard/wiki" label="Назад к списку" mb={4} />

      {/* Form */}
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={8}
      >
        <Heading size="lg" color="fg.default" mb={6}>
          Новая статья
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack gap={5} align="stretch">
            {/* Title */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Заголовок *
              </Text>
              <Input
                value={formData.title}
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
                value={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Начните писать статью..."
                height="400px"
              />
            </Box>

            {/* File Attachments */}
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium" color="fg.default">
                Вложения (опционально)
              </Text>

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

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <VStack align="stretch" gap={2}>
                  {selectedFiles.map((file, index) => (
                    <HStack
                      key={`${file.name}-${index}`}
                      bg="bg.subtle"
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
                        onClick={() => handleRemoveFile(index)}
                      >
                        <LuX />
                      </IconButton>
                    </HStack>
                  ))}
                  <Text fontSize="xs" color="fg.muted">
                    {selectedFiles.length} файл(ов) выбрано
                  </Text>
                </VStack>
              )}
            </Box>

            {/* Submit */}
            <Flex justify="flex-end" gap={3} pt={4}>
              <Link href="/dashboard/wiki">
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
                Опубликовать
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
