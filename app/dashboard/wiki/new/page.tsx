"use client";

import { useState, useEffect, useRef } from "react";
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
import { LuArrowLeft, LuSave, LuPaperclip, LuX, LuFile } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, type CreateWikiArticleRequest } from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";
import { CustomEmojiPicker } from "@/components/features/ticket-chat/CustomEmojiPicker";
import { AxiosError } from "axios";

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewWikiArticlePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Redirect non-specialists
  useEffect(() => {
    if (!isSpecialist) {
      toaster.error({
        title: "Доступ запрещён",
        description: "Только специалисты могут создавать статьи",
        closable: true,
      });
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
      toaster.error({
        title: "Ошибка",
        description: "Введите заголовок статьи",
        closable: true,
      });
      return;
    }

    if (!formData.content.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите содержимое статьи",
        closable: true,
      });
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
          wikiApi.uploadAttachment(article.id, file)
        );

        try {
          await Promise.all(uploadPromises);
          toaster.success({
            title: "Статья опубликована!",
            description: `Загружено ${selectedFiles.length} вложений`,
          });
        } catch (uploadError) {
          toaster.warning({
            title: "Статья создана",
            description: "Некоторые файлы не удалось загрузить",
          });
        }
      } else {
        toaster.success({ title: "Статья опубликована!" });
      }

      router.push(`/dashboard/wiki/${article.slug}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toaster.error({
          title: "Ошибка",
          description: error.response?.data.message,
          closable: true,
        });
      } else {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось создать статью",
          closable: true,
        });
      }
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
      <Link href="/dashboard/wiki">
        <Button variant="ghost" size="sm" mb={4}>
          <LuArrowLeft />
          Назад к списку
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
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Напишите содержимое статьи..."
                bg="bg.subtle"
                rows={15}
                minH="300px"
              />
              <Box>
                {/* Эмодзи перезаписывает текст */}
                <CustomEmojiPicker
                  onSelect={(emoji) =>
                    setFormData((prev) => ({ ...prev, content: emoji }))
                  }
                />
              </Box>
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
