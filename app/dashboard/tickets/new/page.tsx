"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuArrowLeft } from "react-icons/lu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketApi } from "@/lib/api/tickets";
import { toaster } from "@/components/ui/toaster";
import type { CreateTicketRequest, TicketPriority } from "@/types/ticket";
import api from "@/lib/api/client";

interface Category {
  id: number;
  name: string;
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
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: "",
    description: "",
    link1c: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.get<{ data: Category[] }>(
          "/categories/user-selectable"
        );
        setCategories(catRes.data.data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadData();
  }, []);

  // Dynamic collection for categories
  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: categories.map((c) => ({ label: c.name, value: String(c.id) })),
      }),
    [categories]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Заполните заголовок и описание",
        closable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Тикет автоматически направляется на первую линию на бэке
      const ticket = await ticketApi.create(formData);
      toaster.success({
        title: "Тикет создан",
        description: `Тикет #${ticket.id} успешно создан`,
        closable: true,
      });
      router.push(`/dashboard/tickets/${ticket.id}`);
    } catch (error) {
      toaster.error({
        title: "Ошибка",
        description: "Не удалось создать тикет",
        closable: true,
      });
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

          {/* Link 1C */}
          {/* TODO проверить логику, может можно сделать более надженый способ, например получать категории отдельным маршрутом */}
          {formData.categoryUserId ===
            categories.find((c) => c.name.includes("1С"))?.id && (
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
            Тикет будет направлен в службу поддержки автоматически
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
