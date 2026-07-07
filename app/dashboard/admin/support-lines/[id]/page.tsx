"use client";

import { use, useState } from "react";
import {
  Badge,
  Box,
  Button,
  createListCollection,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Select,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuCheck, LuPlus, LuSave, LuTrash2, LuUsers } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/ui";
import { Specialist } from "@/lib/api/supportLines";
import { useSupportLineDetail } from "@/lib/hooks/admin-support-lines";
import { activityStatusConfig, userRolesBadges } from "@/types/auth";
import { AssignmentMode, assignmentModeConfig } from "@/types/ticket";
import { Tooltip } from "@/components/ui/tooltip";
import { specialistTypeApi } from "@/lib/api/specialistTypes";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Роли для фильтрации пользователей при добавлении специалиста
const roleCollection = createListCollection({
  items: [
    { value: "SPECIALIST", label: "Специалист" },
    { value: "SUPERVISOR", label: "Супервизор" },
  ],
});

const assignmentModeCollection = createListCollection({
  items: Object.entries(assignmentModeConfig).map(([value, label]) => ({
    label,
    value,
  })),
});

function formatSla(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} д`;
  if (minutes % 60 === 0) return `${minutes / 60} ч`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ч ${m} мин`;
}

export default function SupportLineDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const lineId = parseInt(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: specialistTypes = [] } = useQuery({
    queryKey: ["specialist-types"],
    queryFn: specialistTypeApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const lineRoleCollection = createListCollection({
    items: specialistTypes.map((t) => ({
      value: t.id.toString(),
      label: t.name,
    })),
  });

  const {
    line,
    isLoading,
    availableSpecialists,
    isLoadingUsers,
    form,
    selection,
    updateLine,
    addSpecialist,
    removeSpecialist,
    deleteLine,
    isUpdating,
    isAddingSpecialist,
    isRemovingSpecialist,
    isDeletingLine,
  } = useSupportLineDetail(lineId);

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
      <BackButton href="/dashboard/admin/support-lines" />

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

        <HStack gap={2}>
          <Button
            bg="gray.900"
            color="white"
            _hover={{ bg: "gray.800" }}
            onClick={() => updateLine()}
            loading={isUpdating}
            disabled={!form.isDirty}
          >
            <LuSave />
            Сохранить
          </Button>

          <Dialog.Root
            open={isDeleteDialogOpen}
            onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}
            lazyMount
            unmountOnExit
          >
            <Dialog.Trigger asChild>
              <Button colorPalette="red" variant="outline">
                <LuTrash2 />
                Удалить
              </Button>
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW="400px">
                  <Dialog.Header>
                    <Dialog.Title>Удалить линию?</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Text>
                      Линия <Text as="strong">«{line.name}»</Text> будет
                      деактивирована. Данные сохранятся в базе.
                    </Text>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Dialog.ActionTrigger asChild>
                      <Button variant="outline">Отмена</Button>
                    </Dialog.ActionTrigger>
                    <Button
                      colorPalette="red"
                      onClick={() => {
                        deleteLine();
                        setIsDeleteDialogOpen(false);
                      }}
                      loading={isDeletingLine}
                    >
                      Удалить
                    </Button>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </HStack>
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
                value={form.description}
                onChange={(e) => form.setDescription(e.target.value)}
                placeholder="Описание линии поддержки"
                rows={3}
              />
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                Тип специалистов
              </Text>
              <Select.Root
                collection={lineRoleCollection}
                value={
                  form.specialistTypeId
                    ? [form.specialistTypeId.toString()]
                    : []
                }
                onValueChange={(e) =>
                  form.setSpecialistTypeId(
                    e.value[0] ? parseInt(e.value[0]) : null,
                  )
                }
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Не задана" />
                </Select.Trigger>
                <Select.Positioner>
                  <Select.Content>
                    {lineRoleCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
              <Text fontSize="xs" color="fg.muted" mt={1}>
                Определяет, в каких сценариях маршрутизации участвует линия
              </Text>
            </Box>

            <HStack gap={4}>
              <Box flex={1}>
                <Text fontWeight="medium" mb={2}>
                  SLA (минут)
                </Text>
                <Input
                  type="number"
                  value={form.slaMinutes}
                  onChange={(e) =>
                    form.setSlaMinutes(parseInt(e.target.value) || 0)
                  }
                  min={1}
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {formatSla(form.slaMinutes)}
                </Text>
              </Box>

              <Box flex={1}>
                <Text fontWeight="medium" mb={2}>
                  Порядок отображения
                </Text>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    form.setDisplayOrder(parseInt(e.target.value) || 0)
                  }
                />
              </Box>
            </HStack>

            <Box>
              <Text fontWeight="medium" mb={2}>
                ID чата поддержки в Telegram{" "}
                {form.telegramChatId && (
                  <Badge variant="subtle" colorPalette="green">
                    Привязан <LuCheck />
                  </Badge>
                )}
              </Text>
              <Input
                placeholder="-100123456789"
                value={form.telegramChatId}
                onChange={(e) => form.setTelegramChatId(e.target.value)}
              />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                ID чата или группы для отправки уведомлений о новых заявках
              </Text>
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                ID чата поддержки ВКонтакте{" "}
                {form.vkChatId && (
                  <Badge variant="subtle" colorPalette="green">
                    Привязан <LuCheck />
                  </Badge>
                )}
              </Text>
              <Input
                placeholder="123456789"
                value={form.vkChatId}
                onChange={(e) => form.setVkChatId(e.target.value)}
              />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                peer_id беседы ВК для отправки уведомлений о новых заявках
              </Text>
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                ID чата поддержки в MAX{" "}
                {form.maxChatId && (
                  <Badge variant="subtle" colorPalette="green">
                    Привязан <LuCheck />
                  </Badge>
                )}
              </Text>
              <Input
                placeholder="123456789"
                value={form.maxChatId}
                onChange={(e) => form.setMaxChatId(e.target.value)}
              />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                chat_id беседы MAX для отправки уведомлений о новых заявках
              </Text>
            </Box>

            <Box>
              <Text fontWeight="medium" mb={2}>
                Режим назначения
              </Text>
              <Tooltip content="Экспериментальная функция, пока не протестирована">
                <Box>
                  <Select.Root
                    collection={assignmentModeCollection}
                    value={[form.assignmentMode]}
                    onValueChange={(e) =>
                      form.setAssignmentMode(e.value[0] as AssignmentMode)
                    }
                    disabled
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
              </Tooltip>
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
            <Flex
              gap={2}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "flex-end" }}
            >
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Роль
                </Text>
                <Select.Root
                  collection={roleCollection}
                  value={selection.selectedRole ? [selection.selectedRole] : []}
                  onValueChange={(e) =>
                    selection.setSelectedRole(e.value[0] || null)
                  }
                >
                  <Select.Trigger>
                    <Select.ValueText placeholder="Выберите роль" />
                  </Select.Trigger>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {roleCollection.items.map(
                          (item: Record<string, string>) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ),
                        )}
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
                  value={
                    selection.selectedUserId
                      ? [selection.selectedUserId.toString()]
                      : []
                  }
                  onValueChange={(e) =>
                    selection.setSelectedUserId(
                      e.value[0] ? parseInt(e.value[0]) : null,
                    )
                  }
                  disabled={!selection.selectedRole || isLoadingUsers}
                >
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder={
                        isLoadingUsers
                          ? "Загрузка..."
                          : !selection.selectedRole
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
                        {specialistCollection.items.map(
                          (item: Record<string, string>) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ),
                        )}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Box>

              <Button
                colorPalette="blue"
                onClick={() =>
                  selection.selectedUserId &&
                  addSpecialist(selection.selectedUserId)
                }
                disabled={!selection.selectedUserId}
                loading={isAddingSpecialist}
                flexShrink={0}
              >
                <LuPlus />
                Добавить
              </Button>
            </Flex>
          </VStack>

          {/* Specialists list */}
          {line.specialists.length === 0 ? (
            <Text color="fg.muted" textAlign="center" py={4}>
              Нет специалистов на этой линии
            </Text>
          ) : (
            <VStack gap={2} align="stretch">
              {line.specialists.map((specialist: Specialist) => (
                <SpecialistRow
                  key={specialist.id}
                  specialist={specialist}
                  onRemove={() => removeSpecialist(specialist.id)}
                  isRemoving={isRemovingSpecialist}
                />
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

const statusDotColor: Record<string, string> = {
  AVAILABLE: "green.500",
  UNAVAILABLE: "gray.400",
  BUSY: "red.500",
  TECHNICAL_ISSUE: "orange.500",
  OFFLINE: "gray.300",
};

function SpecialistRow({
  specialist,
  onRemove,
  isRemoving,
}: {
  specialist: Specialist;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const statusCfg = specialist.activityStatus
    ? activityStatusConfig[specialist.activityStatus]
    : null;

  return (
    <Flex p={3} bg="bg.subtle" borderRadius="lg" align="center" gap={3}>
      {statusCfg ? (
        <Tooltip
          content={`${statusCfg.label}`}
          positioning={{ placement: "top" }}
        >
          <Box
            as="span"
            display="inline-block"
            boxSize="10px"
            borderRadius="full"
            bg={statusDotColor[specialist.activityStatus!] ?? "gray.300"}
            flexShrink={0}
            cursor="default"
          />
        </Tooltip>
      ) : (
        <Box boxSize="10px" flexShrink={0} />
      )}

      <Box minW="130px">
        <Text fontWeight="medium" lineClamp={1}>
          {specialist.fio || specialist.username}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          @{specialist.username}
        </Text>
      </Box>

      <HStack gap={2} flexWrap="wrap" flex={1}>
        {specialist.specialistType && (
          <Badge
            colorPalette={specialist.specialistType.color}
            variant="subtle"
          >
            {specialist.specialistType.name}
          </Badge>
        )}
        {specialist.roles.map((role) => {
          const roleCfg = userRolesBadges[role];
          return roleCfg ? (
            <Badge key={role} colorPalette={roleCfg.color} variant="outline">
              {roleCfg.name}
            </Badge>
          ) : null;
        })}
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
