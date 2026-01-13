"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Badge,
  IconButton,
  Portal,
} from "@chakra-ui/react";
import { Select, createListCollection } from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuSave,
  LuUsers,
  LuClock,
  LuTrash2,
  LuPlus,
} from "react-icons/lu";
import Link from "next/link";
import {
  supportLineApi,
  type SupportLineDetail,
  type Specialist,
  type AssignmentMode,
} from "@/lib/api/supportLines";
import { adminApi, type AdminUser } from "@/lib/api/admin";
import { toast } from "@/lib/utils";
import { userRolesBadges } from "@/types/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Get available roles for selection (excluding USER and ADMIN)
const availableRoles = Object.entries(userRolesBadges)
  .filter(([role]) => role !== "USER" && role !== "ADMIN")
  .map(([role, info]) => ({ value: role, label: info.name }));

const roleCollection = createListCollection({
  items: availableRoles,
});

const assignmentModeCollection = createListCollection({
  items: [
    { label: "Первый свободный", value: "FIRST_AVAILABLE" },
    { label: "Round Robin", value: "ROUND_ROBIN" },
    { label: "Наименее загруженный", value: "LEAST_LOADED" },
    { label: "Прямое назначение", value: "DIRECT" },
  ],
});

export default function SupportLineDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const lineId = parseInt(id);
  const queryClient = useQueryClient();

  // Form state
  const [description, setDescription] = useState("");
  const [slaMinutes, setSlaMinutes] = useState(60);
  const [assignmentMode, setAssignmentMode] =
    useState<AssignmentMode>("FIRST_AVAILABLE");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // User selection for adding specialist
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Queries
  const { data: line, isLoading } = useQuery({
    queryKey: ["support-line", lineId],
    queryFn: () => supportLineApi.get(lineId),
    staleTime: 30 * 1000,
  });

  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users-by-role", selectedRole],
    queryFn: () => adminApi.getUsersByRole(selectedRole!),
    enabled: !!selectedRole,
    staleTime: 60 * 1000,
  });

  // Sync form state when line loads
  const syncFormState = (lineData: SupportLineDetail) => {
    setDescription(lineData.description || "");
    setSlaMinutes(lineData.slaMinutes);
    setAssignmentMode(lineData.assignmentMode);
    setDisplayOrder(lineData.displayOrder);
    setIsFormDirty(false);
  };

  // Initial sync
  if (line && !isFormDirty && description === "" && slaMinutes === 60) {
    syncFormState(line);
  }

  // Mutations
  const updateMutation = useMutation({
    mutationFn: () =>
      supportLineApi.update(lineId, {
        description,
        slaMinutes,
        assignmentMode,
        displayOrder,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Линия обновлена");
      setIsFormDirty(false);
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось обновить линию");
    },
  });

  const addSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
      supportLineApi.addSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Специалист добавлен");
      setSelectedUserId(null);
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось добавить специалиста");
    },
  });

  const removeSpecialistMutation = useMutation({
    mutationFn: (userId: number) =>
      supportLineApi.removeSpecialist(lineId, userId),
    onSuccess: (data) => {
      queryClient.setQueryData(["support-line", lineId], data);
      queryClient.invalidateQueries({ queryKey: ["support-lines"] });
      toast.success("Специалист удален");
    },
    onError: () => {
      toast.error("Ошибка", "Не удалось удалить специалиста");
    },
  });

  // Filter users who are not already on this line
  const availableSpecialists =
    availableUsers?.content.filter(
      (u) => u.active && !line?.specialists.some((s) => s.id === u.id)
    ) || [];

  const specialistCollection = createListCollection({
    items: availableSpecialists.map((u) => ({
      label: u.fio || u.username,
      value: u.id.toString(),
    })),
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!line) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Text color="fg.muted">Линия не найдена</Text>
      </Flex>
    );
  }

  return (
    <Box maxW="900px" mx="auto">
      {/* Back button */}
      <Link href="/dashboard/admin/support-lines">
        <Button variant="ghost" size="sm" mb={4}>
          <LuArrowLeft />
          Назад к списку
        </Button>
      </Link>

      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            {line.name}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Редактирование линии поддержки
          </Text>
        </Box>

        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
          disabled={!isFormDirty}
        >
          <LuSave />
          Сохранить
        </Button>
      </Flex>

      <VStack gap={6} align="stretch">
        {/* Line Settings */}
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={6}
        >
          <Heading size="md" mb={4}>
            Параметры линии
          </Heading>

          <VStack gap={4} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>
                Описание
              </Text>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsFormDirty(true);
                }}
                placeholder="Описание линии поддержки"
                rows={3}
              />
            </Box>

            <HStack gap={4}>
              <Box flex={1}>
                <Text fontWeight="medium" mb={2}>
                  SLA (минут)
                </Text>
                <Input
                  type="number"
                  value={slaMinutes}
                  onChange={(e) => {
                    setSlaMinutes(parseInt(e.target.value) || 0);
                    setIsFormDirty(true);
                  }}
                  min={1}
                />
              </Box>

              <Box flex={1}>
                <Text fontWeight="medium" mb={2}>
                  Порядок отображения
                </Text>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => {
                    setDisplayOrder(parseInt(e.target.value) || 0);
                    setIsFormDirty(true);
                  }}
                />
              </Box>
            </HStack>

            <Box>
              <Text fontWeight="medium" mb={2}>
                Режим назначения
              </Text>
              <Select.Root
                collection={assignmentModeCollection}
                value={[assignmentMode]}
                onValueChange={(e) => {
                  setAssignmentMode(e.value[0] as AssignmentMode);
                  setIsFormDirty(true);
                }}
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {assignmentModeCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>
          </VStack>
        </Box>

        {/* Specialists */}
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={6}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">
              <HStack gap={2}>
                <LuUsers />
                <Text>Специалисты ({line.specialists.length})</Text>
              </HStack>
            </Heading>
          </Flex>

          {/* Add specialist */}
          <VStack gap={3} mb={4} align="stretch">
            <HStack gap={2}>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Роль
                </Text>
                <Select.Root
                  collection={roleCollection}
                  value={selectedRole ? [selectedRole] : []}
                  onValueChange={(e) => {
                    setSelectedRole(e.value[0] || null);
                    setSelectedUserId(null);
                  }}
                >
                  <Select.Trigger>
                    <Select.ValueText placeholder="Выберите роль" />
                  </Select.Trigger>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {roleCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>

              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Пользователь
                </Text>
                <Select.Root
                  collection={specialistCollection}
                  value={selectedUserId ? [selectedUserId.toString()] : []}
                  onValueChange={(e) =>
                    setSelectedUserId(e.value[0] ? parseInt(e.value[0]) : null)
                  }
                  disabled={!selectedRole || isLoadingUsers}
                >
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder={
                        isLoadingUsers
                          ? "Загрузка..."
                          : !selectedRole
                          ? "Сначала выберите роль"
                          : availableSpecialists.length === 0
                          ? "Нет доступных пользователей"
                          : "Выберите пользователя"
                      }
                    />
                  </Select.Trigger>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {specialistCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>

              <Box pt={5}>
                <Button
                  colorPalette="blue"
                  onClick={() =>
                    selectedUserId &&
                    addSpecialistMutation.mutate(selectedUserId)
                  }
                  disabled={!selectedUserId}
                  loading={addSpecialistMutation.isPending}
                >
                  <LuPlus />
                  Добавить
                </Button>
              </Box>
            </HStack>
          </VStack>

          {/* Specialists list */}
          {line.specialists.length === 0 ? (
            <Text color="fg.muted" textAlign="center" py={4}>
              Нет специалистов на этой линии
            </Text>
          ) : (
            <VStack gap={2} align="stretch">
              {line.specialists.map((specialist) => (
                <SpecialistRow
                  key={specialist.id}
                  specialist={specialist}
                  onRemove={() =>
                    removeSpecialistMutation.mutate(specialist.id)
                  }
                  isRemoving={removeSpecialistMutation.isPending}
                />
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

function SpecialistRow({
  specialist,
  onRemove,
  isRemoving,
}: {
  specialist: Specialist;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const statusColors: Record<string, string> = {
    AVAILABLE: "green",
    BUSY: "yellow",
    OFFLINE: "gray",
    ON_BREAK: "orange",
    UNAVAILABLE: "red",
    TECHNICAL_ISSUE: "red",
  };

  const statusLabels: Record<string, string> = {
    AVAILABLE: "Доступен",
    BUSY: "Занят",
    OFFLINE: "Не в сети",
    ON_BREAK: "Перерыв",
    UNAVAILABLE: "Недоступен",
    TECHNICAL_ISSUE: "Тех. проблема",
  };

  return (
    <Flex
      p={3}
      bg="bg.subtle"
      borderRadius="lg"
      justify="space-between"
      align="center"
    >
      <HStack gap={3}>
        <Box>
          <Text fontWeight="medium">
            {specialist.fio || specialist.username}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            @{specialist.username}
          </Text>
        </Box>
        {specialist.roles?.map((role) => {
          const roleInfo =
            userRolesBadges[role as keyof typeof userRolesBadges];
          return (
            <Badge
              key={role}
              colorPalette={roleInfo?.color || "gray"}
              variant="subtle"
            >
              {roleInfo?.name || role}
            </Badge>
          );
        })}
        {specialist.activityStatus && (
          <Badge
            colorPalette={statusColors[specialist.activityStatus] || "gray"}
            variant="subtle"
          >
            {statusLabels[specialist.activityStatus] ||
              specialist.activityStatus}
          </Badge>
        )}
        {!specialist.active && (
          <Badge colorPalette="red" variant="subtle">
            Неактивен
          </Badge>
        )}
      </HStack>

      <IconButton
        aria-label="Удалить специалиста"
        variant="ghost"
        colorPalette="red"
        size="sm"
        onClick={onRemove}
        disabled={isRemoving}
      >
        <LuTrash2 />
      </IconButton>
    </Flex>
  );
}
