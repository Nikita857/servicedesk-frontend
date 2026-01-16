"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  HStack,
  VStack,
  Portal,
  createListCollection,
  Stack,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuArrowLeft, LuInfo } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketApi } from "@/lib/api/tickets";
import {
  useCategoriesQuery,
  useAllSupportLinesQuery,
  useCategoryDetailQuery,
} from "@/lib/hooks";
import { toast } from "@/lib/utils";
import axios from "axios";
import { useEffect } from "react";
import type { CreateTicketRequest, TicketPriority } from "@/types/ticket";

interface SupportLineItem {
  label: string;
  value: string;
  description: string | null;
}
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
  const { supportLines, isLoading: isLoadingLines } = useAllSupportLinesQuery();

  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: "",
    description: "",
    link1c: "",
    priority: "MEDIUM",
  });

  // Fetch details for the selected category to get recommendation
  const { data: categoryDetail } = useCategoryDetailQuery(
    formData.categoryUserId || null
  );

  // Auto-select support line based on category recommendation
  useEffect(() => {
    if (categoryDetail?.recommendedLineId) {
      setFormData((prev) => ({
        ...prev,
        supportLineId: categoryDetail.recommendedLineId!,
      }));
    }
  }, [categoryDetail]);

  // Dynamic collection for categories
  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: categories.map((c) => ({ label: c.name, value: String(c.id) })),
      }),
    [categories]
  );

  // Dynamic collection for support lines (only user-selectable ones: Sysadmins and 1C Support)
  const supportLineCollection = useMemo(
    () =>
      createListCollection<SupportLineItem>({
        items: supportLines
          .filter(
            (line) =>
              // Filter to lines users can select (first two lines typically)
              line.displayOrder <= 2
          )
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((line) => ({
            label: line.name,
            value: String(line.id),
            description: line.description,
          })),
      }),
    [supportLines]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Ошибка", "Заполните заголовок и описание");
      return;
    }

    setIsSubmitting(true);
    try {
      // Тикет автоматически направляется на первую линию на бэке
      const ticket = await ticketApi.create(formData);
      toast.success("Тикет создан", `Тикет #${ticket.id} успешно создан`);
      router.push(`/dashboard/tickets/${ticket.id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(
          "Ошибка",
          error.response.data.message || "Не удалось создать тикет"
        );
      } else {
        toast.error("Ошибка", "Не удалось создать тикет");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <HStack mb={2}>
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">
              <LuArrowLeft />
              Назад
            </Button>
          </Link>
        </HStack>
        <Heading size="lg" color="fg.default">
          Новый тикет
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Создание новой заявки в службу поддержки
        </Text>
      </Box>

      {/* Form */}
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={6}
        maxW="800px"
      >
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
              placeholder="Краткое описание проблемы"
              size="lg"
              bg="bg.subtle"
              borderColor="border.default"
            />
          </Box>

          {/* Description */}
          <Box>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
              Описание *
            </Text>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Подробно опишите проблему..."
              minH="150px"
              bg="bg.subtle"
              borderColor="border.default"
            />
          </Box>

          {/* Priority & Category Row */}
          <HStack gap={4} align="flex-start">
            {/* Priority */}
            <Box flex={1}>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Приоритет
              </Text>
              <Select.Root
                collection={priorityCollection}
                value={[formData.priority || "MEDIUM"]}
                onValueChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.value[0] as TicketPriority,
                  }))
                }
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {priorityCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>

            {/* Category */}
            {categories.length > 0 && (
              <Box flex={1}>
                <Text
                  mb={1}
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.default"
                >
                  Категория
                </Text>
                <Select.Root
                  collection={categoryCollection}
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
                >
                  <Select.Trigger>
                    <Select.ValueText placeholder="Выберите категорию" />
                  </Select.Trigger>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {categoryCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>
            )}
          </HStack>

          {/* Support Line Selection */}
          <Box>
            <HStack mb={1} gap={1}>
              <Text fontSize="sm" fontWeight="medium" color="fg.default">
                Линия поддержки
              </Text>
              <LuInfo size={14} color="var(--chakra-colors-fg-muted)" />
            </HStack>
            <Text fontSize="xs" color="fg.muted" mb={2}>
              Выберите линию поддержки в зависимости от типа проблемы
            </Text>
            <Select.Root
              collection={supportLineCollection}
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
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Выберите линию поддержки (опционально)" />
              </Select.Trigger>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {supportLineCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <VStack align="start" gap={0}>
                          <Text>{item.label}</Text>
                          {item.description && (
                            <Text fontSize="xs" color="fg.muted">
                              {item.description}
                            </Text>
                          )}
                        </VStack>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>

          {/* Link 1C */}
          {categoryDetail?.is1ClinkRecommended && (
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Ссылка 1С
              </Text>
              <Input
                value={formData.link1c || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link1c: e.target.value }))
                }
                placeholder="Ссылка на объект в 1С (опционально)"
                bg="bg.subtle"
                borderColor="border.default"
              />
            </Box>
          )}
          {/* Info text */}
          <Text fontSize="xs" color="fg.muted">
            {formData.supportLineId
              ? "Тикет будет направлен на выбранную линию поддержки"
              : "Тикет будет направлен на первую линию поддержки автоматически"}
          </Text>

          {/* Submit */}
          <Flex justify="flex-end" gap={3} mt={4}>
            <Link href="/dashboard/tickets">
              <Button variant="outline">Отмена</Button>
            </Link>
            <Button
              type="submit"
              bg="gray.900"
              color="white"
              loading={isSubmitting}
              loadingText="Создание..."
              _hover={{ bg: "gray.800" }}
            >
              Создать тикет
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
