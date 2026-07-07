"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Checkbox,
  VStack,
  HStack,
  Badge,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { LuSave, LuSearch, LuX } from "react-icons/lu";
import { BackButton, DataSelect } from "@/components/ui";
import { SurveyQuestionBuilder } from "@/components/features/survey";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { useAuthStore } from "@/stores";
import { useDepartments } from "@/lib/hooks/departments/useDepartments";
import { useCreateSurvey } from "@/lib/hooks/surveys";
import { adminApi } from "@/lib/api/admin";
import { toast } from "@/lib/utils";
import type { SurveyElement } from "@/types/survey";
import type { AdminUserResponse } from "@/types/admin";

function toDatetimeLocalMin(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function NewSurveyPage() {
  const router = useRouter();
  const { isHydrated } = useAuthStore();
  const { has } = useCurrentPermissions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [elements, setElements] = useState<SurveyElement[]>([]);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AdminUserResponse[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const { data: departments = [] } = useDepartments();
  const createMutation = useCreateSurvey();

  const usersQuery = useQuery({
    queryKey: ["admin-users", "survey-target-search", userSearch],
    queryFn: () => adminApi.getUsers(0, 10, userSearch || undefined),
    enabled: userSearch.length > 0,
  });

  useEffect(() => {
    if (isHydrated && !has(PERM.SURVEY_MANAGE)) {
      router.push("/dashboard");
    }
  }, [isHydrated, has, router]);

  const departmentCollection = useMemo(
    () => createListCollection({ items: departments.map((d) => ({ value: String(d.id), label: d.name })) }),
    [departments],
  );

  const selectedUserIds = useMemo(() => new Set(selectedUsers.map((u) => u.id)), [selectedUsers]);

  const toggleUser = (user: AdminUserResponse) => {
    setSelectedUsers((prev) =>
      selectedUserIds.has(user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  if (!isHydrated || !has(PERM.SURVEY_MANAGE)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Ошибка", "Введите название опроса");
      return;
    }
    if (!endDate) {
      toast.error("Ошибка", "Укажите дату окончания опроса");
      return;
    }
    if (elements.length === 0) {
      toast.error("Ошибка", "Добавьте хотя бы один вопрос");
      return;
    }
    if (departmentIds.length === 0 && selectedUsers.length === 0) {
      toast.error("Ошибка", "Выберите хотя бы один отдел или пользователя");
      return;
    }

    try {
      const survey = await createMutation.mutateAsync({
        title,
        description: description || undefined,
        anonymous,
        endDate: new Date(endDate).toISOString(),
        questions: { elements },
        departmentIds: departmentIds.map(Number),
        userIds: selectedUsers.map((u) => u.id),
      });
      router.push(`/dashboard/admin/surveys`);
      void survey;
    } catch {
      // ошибка уже показана через handleApiError в useCreateSurvey
    }
  };

  return (
    <Box maxW="900px" mx="auto">
      <BackButton href="/dashboard/admin/surveys" label="Назад к списку" mb={4} />

      <Box bg="bg.surface" borderRadius="xl" borderWidth="1px" borderColor="border.default" p={8}>
        <Heading size="lg" color="fg.default" mb={6}>
          Новый опрос
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack gap={5} align="stretch">
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Название *
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Оценка удовлетворённости поддержкой"
                bg="bg.subtle"
                maxLength={250}
              />
            </Box>

            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                Описание
              </Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание опроса (опционально)"
                bg="bg.subtle"
                rows={2}
                maxLength={2000}
              />
            </Box>

            <HStack gap={6} align="flex-end">
              <Box flex={1}>
                <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                  Окончание опроса *
                </Text>
                <Input
                  type="datetime-local"
                  value={endDate}
                  min={toDatetimeLocalMin()}
                  onChange={(e) => setEndDate(e.target.value)}
                  bg="bg.subtle"
                />
              </Box>
              <Checkbox.Root
                checked={anonymous}
                onCheckedChange={(d) => setAnonymous(!!d.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Анонимный опрос</Checkbox.Label>
              </Checkbox.Root>
            </HStack>

            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium" color="fg.default">
                Кому отправить
              </Text>
              <VStack align="stretch" gap={3}>
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" fontWeight="medium" color="fg.muted">
                      Отделы
                    </Text>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        setDepartmentIds(
                          departmentIds.length === departments.length
                            ? []
                            : departments.map((d) => String(d.id)),
                        )
                      }
                    >
                      {departmentIds.length === departments.length ? "Снять выбор" : "Выбрать все"}
                    </Button>
                  </HStack>
                  <DataSelect
                    collection={departmentCollection}
                    value={departmentIds}
                    onValueChange={(d) => setDepartmentIds(d.value)}
                    placeholder="Выберите отделы"
                    multiple
                  />
                </Box>

                <Box>
                  <Text mb={1} fontSize="xs" fontWeight="medium" color="fg.muted">
                    Отдельные пользователи
                  </Text>
                  <HStack>
                    <LuSearch color="var(--chakra-colors-fg-subtle)" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Поиск по ФИО или логину"
                      bg="bg.subtle"
                      size="sm"
                    />
                  </HStack>

                  {usersQuery.isLoading && <Spinner size="xs" mt={2} />}

                  {usersQuery.data && usersQuery.data.content.length > 0 && (
                    <VStack align="stretch" gap={1} mt={2} maxH="180px" overflowY="auto">
                      {usersQuery.data.content.map((u) => (
                        <HStack
                          key={u.id}
                          px={2}
                          py={1}
                          borderRadius="md"
                          cursor="pointer"
                          bg={selectedUserIds.has(u.id) ? "bg.muted" : "transparent"}
                          _hover={{ bg: "bg.subtle" }}
                          onClick={() => toggleUser(u)}
                        >
                          <Text fontSize="sm">{u.fio ?? u.username}</Text>
                          <Text fontSize="xs" color="fg.subtle">
                            @{u.username}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {selectedUsers.length > 0 && (
                    <HStack wrap="wrap" gap={2} mt={2}>
                      {selectedUsers.map((u) => (
                        <Badge key={u.id} colorPalette="blue" display="flex" alignItems="center" gap={1}>
                          {u.fio ?? u.username}
                          <Box as="span" cursor="pointer" onClick={() => toggleUser(u)}>
                            <LuX size={12} />
                          </Box>
                        </Badge>
                      ))}
                    </HStack>
                  )}
                </Box>
              </VStack>
            </Box>

            <Box>
              <Text mb={2} fontSize="sm" fontWeight="medium" color="fg.default">
                Вопросы *
              </Text>
              <SurveyQuestionBuilder elements={elements} onChange={setElements} />
            </Box>

            <Flex justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={() => router.push("/dashboard/admin/surveys")}>
                Отмена
              </Button>
              <Button
                type="submit"
                bg="gray.900"
                color="white"
                loading={createMutation.isPending}
                _hover={{ bg: "gray.800" }}
              >
                <LuSave /> Создать и отправить
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
