import { toaster } from "@/components/ui/toaster";
import { Specialist, SupportLine } from "@/lib/api";
import { Ticket } from "@/types";
import {
  Box,
  Button,
  Heading,
  HStack,
  Textarea,
  VStack,
  Text,
  Select,
  Portal,
  createListCollection,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { LuForward, LuUserPlus } from "react-icons/lu";

interface EscalationPanelProps {
  supportLines: SupportLine[];
  specialists: Specialist[];
  selectedLineId: number | undefined;
  setSelectedLineId: (arg: number | undefined) => void;
  selectedSpecialistId: number | undefined;
  setSelectedSpecialistId: (arg: number | undefined) => void;
  isLoadingSpecialists: boolean;
  setIsLoadingSpecialists: (arg: boolean) => void;
  escalationComment: string;
  setEscalationComment: (arg: string) => void;
  isEscalating: boolean;
  setShowEscalation: (arg: boolean) => void;
  handleEscalate: () => void;
}

export default function EscalationPanel({
  supportLines,
  specialists,
  selectedLineId,
  setSelectedLineId,
  selectedSpecialistId,
  setSelectedSpecialistId,
  isLoadingSpecialists,
  escalationComment,
  setEscalationComment,
  setShowEscalation,
  isEscalating,
  handleEscalate,
}: EscalationPanelProps) {
  // Collections for selects
  const lineCollection = useMemo(
    () =>
      createListCollection({
        items: supportLines.map((l) => ({
          label: l.name,
          value: String(l.id),
        })),
      }),
    [supportLines]
  );

  const specialistCollection = useMemo(
    () =>
      createListCollection({
        items: specialists.map((s) => ({
          label: s.fio || s.username,
          value: String(s.id),
        })),
      }),
    [specialists]
  );
  return (
    <Box
      mb={6}
      bg="orange.50"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="orange.200"
      p={6}
      _dark={{ bg: "orange.900/20", borderColor: "orange.700" }}
    >
      <HStack mb={4}>
        <LuForward />
        <Heading size="sm" color="fg.default">
          Переадресация тикета
        </Heading>
      </HStack>

      <VStack gap={4} align="stretch">
        {/* Support Line Select */}
        <Box>
          <Text mb={1} fontSize="sm" fontWeight="medium">
            Линия поддержки *
          </Text>
          <Select.Root
            collection={lineCollection}
            value={selectedLineId ? [String(selectedLineId)] : []}
            onValueChange={(e) =>
              setSelectedLineId(Number(e.value[0]) || undefined)
            }
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Выберите линию" />
            </Select.Trigger>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {lineCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Box>

        {/* Specialist Select (appears when line selected) */}
        {selectedLineId && (
          <Box>
            <Text mb={1} fontSize="sm" fontWeight="medium">
              Назначить специалисту (опционально)
            </Text>
            <Select.Root
              collection={specialistCollection}
              value={selectedSpecialistId ? [String(selectedSpecialistId)] : []}
              onValueChange={(e) =>
                setSelectedSpecialistId(Number(e.value[0]) || undefined)
              }
              disabled={isLoadingSpecialists || specialists.length === 0}
            >
              <Select.Trigger>
                <Select.ValueText
                  placeholder={
                    isLoadingSpecialists
                      ? "Загрузка..."
                      : specialists.length === 0
                      ? "Нет специалистов"
                      : "Любой специалист линии"
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
        )}

        {/* Comment - REQUIRED */}
        <Box>
          <Text mb={1} fontSize="sm" fontWeight="medium">
            Комментарий *
          </Text>
          <Textarea
            value={escalationComment}
            onChange={(e) => setEscalationComment(e.target.value)}
            placeholder="Причина переадресации (обязательно)..."
            minH="80px"
            bg="bg.surface"
          />
        </Box>

        {/* Actions */}
        <HStack justify="flex-end" gap={2}>
          <Button variant="ghost" onClick={() => setShowEscalation(false)}>
            Отмена
          </Button>
          <Button
            bg="orange.500"
            color="white"
            _hover={{ bg: "orange.600" }}
            onClick={handleEscalate}
            loading={isEscalating}
            disabled={!selectedLineId || !escalationComment.trim()}
          >
            <LuUserPlus />
            Переадресовать
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
