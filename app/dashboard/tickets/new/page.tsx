"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Input,
  Textarea,
  HStack,
  VStack,
  createListCollection,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { ticketApi } from "@/lib/api/tickets";
import {
  useCategoryDetailQuery,
  useCategoriesQuery,
} from "@/lib/hooks";
import { toast, handleApiError } from "@/lib/utils";
import { DataSelect, BackButton } from "@/components/ui";
import type { CreateTicketRequest, TicketPriority } from "@/types/ticket";
import { useAvailableSupportLinesQuery } from "@/lib/hooks/useAvailableSupportLinesQuery";

const priorityCollection = createListCollection({
  items: [
    { label: "Низкий", value: "LOW" },
    { label: "Средний", value: "MEDIUM" },
    { label: "Высокий", value: "HIGH" },
    { label: "Срочный", value: "URGENT" },
  ],
});

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories and support lines using TanStack Query
  const { data: categories = [] } = useCategoriesQuery();
  const { supportLines, isLoading: isLoadingLines } = useAvailableSupportLinesQuery();

  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: "",
    description: "",
    link1c: "",
    priority: "MEDIUM",
  });

  // Re-fetch category detail when category selection changes to see recommendations
  const { data: categoryDetail } = useCategoryDetailQuery(
    formData.categoryUserId || 0,
  );

  // Auto-select support line if recommended by category
  useEffect(() => {
    if (categoryDetail?.recommendedLineId) {
      setFormData((prev) => ({
        ...prev,
        supportLineId: categoryDetail.recommendedLineId ?? undefined,
      }));
    }
  }, [categoryDetail]);

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: categories.map((cat) => ({
          label: cat.name,
          value: cat.id.toString(),
        })),
      }),
    [categories],
  );

  const supportLineCollection = useMemo(
    () =>
      createListCollection({
        items: supportLines.map((line) => ({
          label: line.name,
          value: line.id.toString(),
          description: line.description,
        })),
      }),
    [supportLines],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.categoryUserId) {
      toast.error("Ошибка", "Заполните все обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await ticketApi.create({
        ...formData,
        categoryUserId: formData.categoryUserId,
      });

      toast.success("Тикет создан", `Тикет #${ticket.id} успешно создан`);
      router.push(`/dashboard/tickets/${ticket.id}`);
    } catch (error) {
      handleApiError(error, { context: "создать тикет" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" py={8} px={4}>
      {/* Header */}
      <Box mb={6}>
        <HStack mb={2}>
          <BackButton href="/dashboard/tickets" />
        </HStack>
        <Heading size="lg" color="fg.default">
          Новый тикет
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Создание новой заявки в службу поддержки
        </Text>
      </Box>

      <Box
        bg="bg.surface"
        p={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        boxShadow="sm"
      >
        <form onSubmit={handleSubmit}>
          <VStack gap={6} align="stretch">
            {/* Title */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Тема обращения сокращенно (Заголовок) *
              </Text>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Например: Не работает принтер"
                bg="bg.subtle"
                required
              />
            </Box>

            <HStack gap={4} align="flex-start">
              {/* Priority */}
              <Box flex={1}>
                <DataSelect
                  label="Приоритет"
                  collection={priorityCollection}
                  value={[formData.priority || "MEDIUM"]}
                  onValueChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.value[0] as TicketPriority,
                    }))
                  }
                />
              </Box>

              {categories.length > 0 && (
                <Box flex={1}>
                  <DataSelect
                    label="Категория"
                    collection={categoryCollection}
                    placeholder="Выберите категорию"
                    value={
                      formData.categoryUserId
                        ? [String(formData.categoryUserId)]
                        : []
                    }
                    onValueChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoryUserId: Number(e.value[0]) || undefined,
                      }))
                    }
                  />
                </Box>
              )}
            </HStack>

            {/* Support Line Selection */}
            <DataSelect
              label="Линия поддержки"
              collection={supportLineCollection}
              placeholder="Выберите линию поддержки (опционально)"
              value={
                formData.supportLineId ? [String(formData.supportLineId)] : []
              }
              onValueChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  supportLineId: Number(e.value[0]) || undefined,
                }))
              }
              disabled={isLoadingLines}
              helperText="Выберите линию поддержки в зависимости от типа проблемы"
              renderItem={(item) => (
                <VStack align="start" gap={0}>
                  <Text>{item.label}</Text>
                  {item.description && (
                    <Text fontSize="xs" color="fg.muted">
                      {item.description}
                    </Text>
                  )}
                </VStack>
              )}
            />

            {/* Link 1C */}
            {categoryDetail?.is1ClinkRecommended && (
              <Box>
                <Text
                  mb={1}
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.default"
                >
                  Ссылка на объект 1С (опционально)
                </Text>
                <Input
                  value={formData.link1c || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, link1c: e.target.value }))
                  }
                  placeholder="Напр. e1cib/data/..."
                  bg="bg.subtle"
                />
              </Box>
            )}

            {/* Description */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Подробное описание проблемы *
              </Text>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Опишите проблему как можно подробнее..."
                bg="bg.subtle"
                rows={6}
                required
              />
            </Box>

            <Flex justify="flex-end" pt={4}>
              <Button
                type="submit"
                size="md"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
                loading={isSubmitting}
              >
                Создать тикет
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
