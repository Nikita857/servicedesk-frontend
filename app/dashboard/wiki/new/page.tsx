"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuArrowLeft, LuSave } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { wikiApi, type CreateWikiArticleRequest } from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { toaster } from "@/components/ui/toaster";
import { CustomEmojiPicker } from "@/components/features/ticket-chat/CustomEmojiPicker";
import { AxiosError } from "axios";

export default function NewWikiArticlePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWikiArticleRequest>({
    title: "",
    content: "",
    excerpt: "",
    tags: [],
  });
  const [tagsInput, setTagsInput] = useState("");

  // Redirect non-specialists
  useEffect(() => {
    if (!isSpecialist) {
      toaster.error({
        title: "Доступ запрещён",
        description: "Только специалисты могут создавать статьи",
        closable: true
      });
      router.push("/dashboard/wiki");
    }
  }, [isSpecialist, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите заголовок статьи",
        closable: true
      });
      return;
    }

    if (!formData.content.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Введите содержимое статьи",
        closable: true
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

      const article = await wikiApi.create({
        ...formData,
        tags,
      });
      toaster.success({ title: "Статья опубликована!" });
      router.push(`/dashboard/wiki/${article.slug}`);
    } catch (error) {
      if(error instanceof AxiosError) {
        toaster.error({
        title: "Ошибка",
        description: error.response?.data.message,
        closable: true,
      });
      }else{
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
                <CustomEmojiPicker onSelect={(emoji) => setFormData((prev) => ({...prev, content: emoji}))}/>
              </Box>
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
