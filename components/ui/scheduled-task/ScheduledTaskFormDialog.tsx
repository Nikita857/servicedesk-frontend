"use client";

import { useEffect, useMemo } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { DataSelect } from "@/components/ui";
import RecurrenceFields from "./RecurrenceFields";
import { supportLineApi } from "@/lib/api/supportLines";
import { useAvailableSupportLinesQuery } from "@/lib/hooks/support-lines/useAvailableSupportLinesQuery";
import { useCategoriesQuery } from "@/lib/hooks/shared/useCategoriesQuery";
import {
  useCreateScheduledTask,
  useUpdateScheduledTask,
} from "@/lib/hooks/scheduled-tasks";
import { toast } from "@/lib/utils";
import type {
  CreateScheduledTaskRequest,
  DayOfWeek,
  ScheduledTaskResponse,
} from "@/types/scheduler";
import type { TicketPriority } from "@/types/ticket";

const priorityCollection = createListCollection({
  items: [
    { label: "Низкий", value: "LOW" },
    { label: "Средний", value: "MEDIUM" },
    { label: "Высокий", value: "HIGH" },
    { label: "Срочный", value: "URGENT" },
  ],
});

const DEFAULT_FORM: CreateScheduledTaskRequest = {
  title: "",
  description: "",
  priority: "MEDIUM",
  recurrenceType: "NONE",
  recurrenceDaysOfWeek: [],
  scheduledAt: "",
  deadlineAt: "",
};

function toLocalDateTimeString(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

interface IProps {
  open: boolean;
  onClose: () => void;
  task?: ScheduledTaskResponse;
  prefilledDate?: string;
}

export default function ScheduledTaskFormDialog({
  open,
  onClose,
  task,
  prefilledDate,
}: IProps) {
  const isEdit = !!task;
  const [formData, setFormData] =
    useState<CreateScheduledTaskRequest>(DEFAULT_FORM);

  const createMutation = useCreateScheduledTask();
  const updateMutation = useUpdateScheduledTask();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Заполняем форму при открытии в режиме редактирования
  useEffect(() => {
    if (open) {
      if (task) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          title: task.title,
          description: task.description,
          link1c: task.link1c ?? undefined,
          categoryUserId: task.categoryUser?.id ?? undefined,
          priority: task.priority ?? "MEDIUM",
          supportLineId: task.supportLine?.id ?? undefined,
          assignToUserId: task.assignTo?.id ?? undefined,
          scheduledAt: task.scheduledAt,
          recurrenceType: task.recurrenceType,
          recurrenceDaysOfWeek: task.recurrenceDaysOfWeek ?? [],
          recurrenceUntil: task.recurrenceUntil ?? undefined,
          deadlineAt: task.deadlineAt ?? undefined,
        });
      } else if (prefilledDate) {
        setFormData({ ...DEFAULT_FORM, scheduledAt: prefilledDate });
      } else {
        setFormData(DEFAULT_FORM);
      }
    }
  }, [open, task, prefilledDate]);

  // Данные для селектов
  const { data: categories = [] } = useCategoriesQuery();
  const { supportLines, isLoading: isLoadingLines } =
    useAvailableSupportLinesQuery();

  // Специалисты выбранной линии
  const { data: specialists = [] } = useQuery({
    queryKey: ["support-line-specialists", formData.supportLineId],
    queryFn: () => supportLineApi.getSpecialists(formData.supportLineId!),
    enabled: !!formData.supportLineId,
  });

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: categories.map((c) => ({ label: c.name, value: String(c.id) })),
      }),
    [categories],
  );

  const supportLineCollection = useMemo(
    () =>
      createListCollection({
        items: supportLines.map((l) => ({
          label: l.name,
          value: String(l.id),
          description: l.description,
        })),
      }),
    [supportLines],
  );

  const specialistCollection = useMemo(
    () =>
      createListCollection({
        items: specialists.map((s) => ({
          label: s.fio || s.username,
          value: String(s.id),
        })),
      }),
    [specialists],
  );

  const patch = (fields: Partial<CreateScheduledTaskRequest>) =>
    setFormData((prev) => ({ ...prev, ...fields }));

  const handleSupportLineChange = (lineId: number | undefined) => {
    patch({ supportLineId: lineId, assignToUserId: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.scheduledAt
    ) {
      toast.warning("Ошибка", "Заполните все обязательные поля");
      return;
    }

    if (new Date(formData.scheduledAt) <= new Date()) {
      toast.warning("Ошибка", "Дата запуска должна быть в будущем");
      return;
    }

    if (
      formData.recurrenceType === "WEEKLY" &&
      !formData.recurrenceDaysOfWeek?.length
    ) {
      toast.warning(
        "Ошибка",
        "Для еженедельного повторения выберите дни недели",
      );
      return;
    }

    if (
      formData.recurrenceType === "NONE" &&
      formData.deadlineAt &&
      new Date(formData.deadlineAt) <= new Date(formData.scheduledAt)
    ) {
      toast.warning("Ошибка", "Дедлайн должен быть позже даты запуска");
      return;
    }

    // Очищаем поля, которые бекенд не принимает для NONE
    const payload: CreateScheduledTaskRequest = {
      ...formData,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      recurrenceDaysOfWeek:
        formData.recurrenceType === "WEEKLY"
          ? formData.recurrenceDaysOfWeek
          : [],
      recurrenceUntil:
        formData.recurrenceType !== "NONE"
          ? formData.recurrenceUntil
          : undefined,
      deadlineAt:
        formData.recurrenceType === "NONE" && formData.deadlineAt
          ? new Date(formData.deadlineAt).toISOString()
          : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: task.id, body: payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="580px">
            <form onSubmit={handleSubmit}>
              <Dialog.Header>
                <Dialog.Title>
                  {isEdit
                    ? "Редактировать задачу"
                    : "Новая запланированная задача"}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  {/* Заголовок */}
                  <Box>
                    <Text
                      mb={1}
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.default"
                    >
                      Заголовок{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Input
                      value={formData.title}
                      onChange={(e) => patch({ title: e.target.value })}
                      placeholder="Например: Еженедельный отчёт"
                      maxLength={250}
                      bg="bg.subtle"
                    />
                  </Box>

                  <HStack gap={4} align="flex-start">
                    {/* Приоритет */}
                    <Box flex={1}>
                      <DataSelect
                        label="Приоритет"
                        collection={priorityCollection}
                        value={[formData.priority ?? "MEDIUM"]}
                        onValueChange={(e) =>
                          patch({ priority: e.value[0] as TicketPriority })
                        }
                        portalled={false}
                      />
                    </Box>

                    {/* Категория */}
                    {categories.length > 0 && (
                      <Box flex={1}>
                        <DataSelect
                          label="Категория"
                          collection={categoryCollection}
                          placeholder="Не выбрана"
                          value={
                            formData.categoryUserId
                              ? [String(formData.categoryUserId)]
                              : []
                          }
                          onValueChange={(e) =>
                            patch({
                              categoryUserId: Number(e.value[0]) || undefined,
                            })
                          }
                          portalled={false}
                        />
                      </Box>
                    )}
                  </HStack>

                  {/* Линия поддержки */}
                  <DataSelect
                    label="Линия поддержки"
                    collection={supportLineCollection}
                    placeholder="Не выбрана"
                    value={
                      formData.supportLineId
                        ? [String(formData.supportLineId)]
                        : []
                    }
                    onValueChange={(e) =>
                      handleSupportLineChange(Number(e.value[0]) || undefined)
                    }
                    disabled={isLoadingLines}
                    portalled={false}
                  />

                  {/* Исполнитель */}
                  <DataSelect
                    label="Исполнитель"
                    collection={specialistCollection}
                    placeholder={
                      formData.supportLineId
                        ? "Выберите исполнителя"
                        : "Сначала выберите линию"
                    }
                    value={
                      formData.assignToUserId
                        ? [String(formData.assignToUserId)]
                        : []
                    }
                    onValueChange={(e) =>
                      patch({ assignToUserId: Number(e.value[0]) || undefined })
                    }
                    disabled={!formData.supportLineId}
                    portalled={false}
                  />

                  {/* Ссылка 1С */}
                  <Box>
                    <Text
                      mb={1}
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.default"
                    >
                      Ссылка 1С (опционально)
                    </Text>
                    <Input
                      value={formData.link1c ?? ""}
                      onChange={(e) =>
                        patch({ link1c: e.target.value || undefined })
                      }
                      placeholder="e1cib/data/..."
                      maxLength={1000}
                      bg="bg.subtle"
                    />
                  </Box>

                  {/* Описание */}
                  <Box>
                    <Text
                      mb={1}
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.default"
                    >
                      Описание{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      placeholder="Подробное описание задачи..."
                      rows={4}
                      bg="bg.subtle"
                    />
                  </Box>

                  {/* Дата запуска */}
                  <Box>
                    <Text
                      mb={1}
                      fontSize="sm"
                      fontWeight="medium"
                      color="fg.default"
                    >
                      Дата и время запуска{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <input
                      type="datetime-local"
                      value={
                        formData.scheduledAt
                          ? toLocalDateTimeString(formData.scheduledAt)
                          : ""
                      }
                      onChange={(e) =>
                        patch({
                          scheduledAt: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--chakra-colors-border-default)",
                        background: "var(--chakra-colors-bg-subtle)",
                        fontSize: "14px",
                        color: "var(--chakra-colors-fg-default)",
                      }}
                    />
                  </Box>

                  {/* Поле выбора дедлайна */}
                  {formData.recurrenceType === "NONE" && (
                    <Box>
                      <Text
                        mb={1}
                        fontSize="sm"
                        fontWeight="medium"
                        color="fg.default"
                      >
                        Срок выполнения (опционально)
                      </Text>
                      <input
                        type="datetime-local"
                        value={
                          formData.deadlineAt
                            ? toLocalDateTimeString(formData.deadlineAt)
                            : ""
                        }
                        onChange={(e) =>
                          patch({
                            deadlineAt: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : "",
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border:
                            "1px solid var(--chakra-colors-border-default)",
                          background: "var(--chakra-colors-bg-subtle)",
                          fontSize: "14px",
                          color: "var(--chakra-colors-fg-default)",
                        }}
                      />
                    </Box>
                  )}

                  {/* Повторение */}
                  <RecurrenceFields
                    recurrenceType={formData.recurrenceType}
                    recurrenceDaysOfWeek={
                      (formData.recurrenceDaysOfWeek ?? []) as DayOfWeek[]
                    }
                    recurrenceUntil={formData.recurrenceUntil}
                    onChange={patch}
                  />
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <HStack gap={3}>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    bg="gray.900"
                    color="white"
                    _hover={{ bg: "gray.800" }}
                    loading={isPending}
                  >
                    {isEdit ? "Сохранить" : "Создать"}
                  </Button>
                </HStack>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
