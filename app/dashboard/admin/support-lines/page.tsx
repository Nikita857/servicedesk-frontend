"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Badge,
  Button,
  Input,
  Textarea,
  Portal,
  createListCollection,
  Dialog,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuClock, LuUsers, LuChevronRight, LuPlus } from "react-icons/lu";
import Link from "next/link";
import { useSupportLines } from "@/lib/hooks/admin-support-lines";
import type { SupportLineListResponse, CreateSupportLineRequest } from "@/types/support-line";
import { userRolesBadges } from "@/types/auth";
import type { SenderType } from "@/types/auth";

// Только специалистические роли для линий поддержки
const lineRoleOptions = Object.entries(userRolesBadges)
  .filter(([role]) => role !== "USER" && role !== "ADMIN")
  .map(([role, info]) => ({ value: role, label: info.name }));

const lineRoleCollection = createListCollection({ items: lineRoleOptions });

function formatSla(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} д`;
  if (minutes % 60 === 0) return `${minutes / 60} ч`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ч ${m} мин`;
}

export default function SupportLinesPage() {
  const { lines, isLoading, createLine, isCreating } = useSupportLines();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSlaMinutes, setNewSlaMinutes] = useState(1440);
  const [newDisplayOrder, setNewDisplayOrder] = useState(100);
  const [newRole, setNewRole] = useState<SenderType | null>(null);

  const handleCreate = () => {
    if (!newName.trim() || !newRole) return;
    const req: CreateSupportLineRequest = {
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      slaMinutes: newSlaMinutes,
      role: newRole,
      displayOrder: newDisplayOrder,
    };
    createLine(req);
    setIsDialogOpen(false);
    setNewName("");
    setNewDescription("");
    setNewSlaMinutes(1440);
    setNewDisplayOrder(100);
    setNewRole(null);
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Линии поддержки
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление линиями поддержки и специалистами
          </Text>
        </Box>

        <Dialog.Root
          open={isDialogOpen}
          onOpenChange={(e) => setIsDialogOpen(e.open)}
        >
          <Dialog.Trigger asChild>
            <Button bg="gray.900" color="white" _hover={{ bg: "gray.800" }}>
              <LuPlus />
              Создать линию
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="480px">
                <Dialog.Header>
                  <Dialog.Title>Новая линия поддержки</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <VStack gap={4} align="stretch">
                    <Box>
                      <Text fontWeight="medium" mb={2}>
                        Название <Text as="span" color="red.500">*</Text>
                      </Text>
                      <Input
                        placeholder="Например: 1-я линия"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        maxLength={100}
                      />
                    </Box>

                    <Box>
                      <Text fontWeight="medium" mb={2}>
                        Роль специалистов <Text as="span" color="red.500">*</Text>
                      </Text>
                      <Select.Root
                        collection={lineRoleCollection}
                        value={newRole ? [newRole] : []}
                        onValueChange={(e) =>
                          setNewRole((e.value[0] as SenderType) || null)
                        }
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Выберите роль" />
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
                    </Box>

                    <Box>
                      <Text fontWeight="medium" mb={2}>
                        Описание
                      </Text>
                      <Textarea
                        placeholder="Краткое описание линии"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={2}
                        maxLength={500}
                      />
                    </Box>

                    <HStack gap={3}>
                      <Box flex={1}>
                        <Text fontWeight="medium" mb={2}>
                          SLA (минут)
                        </Text>
                        <Input
                          type="number"
                          value={newSlaMinutes}
                          onChange={(e) =>
                            setNewSlaMinutes(parseInt(e.target.value) || 1440)
                          }
                          min={1}
                          max={10080}
                        />
                      </Box>
                      <Box flex={1}>
                        <Text fontWeight="medium" mb={2}>
                          Порядок
                        </Text>
                        <Input
                          type="number"
                          value={newDisplayOrder}
                          onChange={(e) =>
                            setNewDisplayOrder(parseInt(e.target.value) || 100)
                          }
                          min={0}
                        />
                      </Box>
                    </HStack>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Отмена</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    bg="gray.900"
                    color="white"
                    _hover={{ bg: "gray.800" }}
                    onClick={handleCreate}
                    disabled={!newName.trim() || !newRole}
                    loading={isCreating}
                  >
                    Создать
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : !lines || lines.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="200px"
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Text color="fg.muted">Нет линий поддержки</Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {lines.map((line: SupportLineListResponse) => (
            <SupportLineCard key={line.id} line={line} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function SupportLineCard({ line }: { line: SupportLineListResponse }) {
  const roleInfo = line.role
    ? userRolesBadges[line.role as keyof typeof userRolesBadges]
    : null;

  return (
    <Link href={`/dashboard/admin/support-lines/${line.id}`}>
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={4}
        _hover={{ borderColor: "gray.300", shadow: "sm" }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <Flex justify="space-between" align="center" gap={3}>
          <Box flex={1}>
            <HStack gap={2} mb={2}>
              <Text fontWeight="medium" color="fg.default" fontSize="lg">
                {line.name}
              </Text>
              <Badge colorPalette="blue" variant="subtle">
                #{line.displayOrder}
              </Badge>
              {roleInfo && (
                <Badge colorPalette={roleInfo.color} variant="subtle">
                  {roleInfo.name}
                </Badge>
              )}
            </HStack>

            {line.description && (
              <Text fontSize="sm" color="fg.muted" mb={2}>
                {line.description}
              </Text>
            )}

            <HStack gap={4} fontSize="sm" color="fg.muted">
              <HStack gap={1}>
                <LuClock size={14} />
                <Text>SLA: {formatSla(line.slaMinutes)}</Text>
              </HStack>
              <HStack gap={1}>
                <LuUsers size={14} />
                <Text>Специалистов: {line.specialistCount}</Text>
              </HStack>
            </HStack>
          </Box>

          <LuChevronRight size={20} />
        </Flex>
      </Box>
    </Link>
  );
}
