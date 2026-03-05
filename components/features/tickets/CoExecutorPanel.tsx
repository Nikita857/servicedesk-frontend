import { useState } from "react";
import {
  Box,
  Button,
  HStack,
  Heading,
  IconButton,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlus, LuUsers, LuX } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { supportLineApi } from "@/lib/api/supportLines";
import { queryKeys } from "@/lib/queryKeys";
import { useCoExecutors } from "@/lib/hooks/ticket-detail/useCoExecutors";
import type { Ticket } from "@/types/ticket";

interface CoExecutorPanelProps {
  ticket: Ticket;
  canEdit?: boolean;
}

export default function CoExecutorPanel({ ticket, canEdit = false }: CoExecutorPanelProps) {
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  const lineId = ticket.supportLine?.id;

  const specialistsQuery = useQuery({
    queryKey: queryKeys.supportLines.specialists(lineId ?? 0),
    queryFn: () => supportLineApi.getSpecialists(lineId!),
    enabled: !!lineId && showAddForm,
    staleTime: 60 * 1000,
  });

  const { coExecutors, isLoading, add, isAdding, remove, isRemoving } =
    useCoExecutors(ticket.id);

  const existingUserIds = new Set(coExecutors.map((c) => c.userId));
  const assignedToId = ticket.assignedTo?.id;

  const availableSpecialists = (specialistsQuery.data ?? []).filter(
    (s) => !existingUserIds.has(s.id) && s.id !== assignedToId
  );

  const handleAdd = () => {
    if (!selectedSpecialistId) return;
    add(Number(selectedSpecialistId), {
      onSuccess: () => {
        setSelectedSpecialistId("");
        setShowAddForm(false);
      },
    });
  };

  // Пользователям показываем только если есть кто-то
  if (!canEdit && !isLoading && coExecutors.length === 0) {
    return null;
  }

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <HStack>
          <LuUsers size={16} />
          <Heading size="sm" color="fg.default">
            Соисполнители
          </Heading>
        </HStack>
        {canEdit && !showAddForm && (
          <IconButton
            aria-label="Добавить соисполнителя"
            variant="ghost"
            size="xs"
            onClick={() => setShowAddForm(true)}
          >
            <LuPlus />
          </IconButton>
        )}
      </HStack>

      {/* Add form - только для редакторов */}
      {canEdit && showAddForm && (
        <Box mb={3}>
          <NativeSelect.Root size="sm" mb={2} disabled={specialistsQuery.isLoading}>
            <NativeSelect.Field
              value={selectedSpecialistId}
              onChange={(e) => setSelectedSpecialistId(e.target.value)}
            >
              <option value="">— Выберите специалиста —</option>
              {availableSpecialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fio || s.username}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <HStack gap={2} justify="flex-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setSelectedSpecialistId("");
              }}
              disabled={isAdding}
            >
              Отмена
            </Button>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={handleAdd}
              loading={isAdding}
              disabled={!selectedSpecialistId}
            >
              Добавить
            </Button>
          </HStack>
        </Box>
      )}

      {/* List */}
      {isLoading ? (
        <Text fontSize="sm" color="fg.muted">
          Загрузка...
        </Text>
      ) : coExecutors.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {canEdit ? "Соисполнители не назначены" : "—"}
        </Text>
      ) : (
        <VStack align="stretch" gap={1}>
          {coExecutors.map((ce) => (
            <HStack key={ce.assignmentId} justify="space-between">
              <Text fontSize="sm">{ce.fio || ce.username}</Text>
              {canEdit && (
                <IconButton
                  aria-label="Удалить соисполнителя"
                  variant="ghost"
                  size="xs"
                  colorPalette="red"
                  onClick={() => remove(ce.userId)}
                  loading={isRemoving}
                >
                  <LuX />
                </IconButton>
              )}
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
