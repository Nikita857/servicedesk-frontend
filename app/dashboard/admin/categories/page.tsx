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
  IconButton,
  Table,
  Menu,
  type ListCollection,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { LuPlus, LuChevronDown, LuPencil, LuTrash2, LuTag } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@/lib/hooks/admin-categories";
import { supportLineApi } from "@/lib/api/supportLines";
import type {
  CategoryDetailResponse,
  CategoryType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/types/category";
import { categoryTypeConfig } from "@/types/category";

const typeCollection = createListCollection({
  items: Object.entries(categoryTypeConfig).map(([value, { label }]) => ({
    value,
    label,
  })),
});

const DEFAULT_FORM = {
  name: "",
  description: "",
  type: "GENERAL" as CategoryType,
  displayOrder: 100,
  recommendedLineId: null as number | null,
};

type FormState = typeof DEFAULT_FORM;

export default function CategoriesPage() {
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const { data: supportLines = [] } = useQuery({
    queryKey: ["support-lines"],
    queryFn: () => supportLineApi.getAll(),
    staleTime: 60 * 1000,
  });

  const lineCollection = createListCollection({
    items: [
      { value: "", label: "Не задана" },
      ...supportLines.map((l) => ({ value: l.id.toString(), label: l.name })),
    ],
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_FORM);

  const [editTarget, setEditTarget] = useState<CategoryDetailResponse | null>(null);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);

  const [deleteTarget, setDeleteTarget] = useState<CategoryDetailResponse | null>(null);

  const handleCreate = () => {
    createCategory({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      type: createForm.type,
      displayOrder: createForm.displayOrder,
      userSelectable: true,
      recommendedLineId: createForm.recommendedLineId,
    } as CreateCategoryRequest);
    setIsCreateOpen(false);
    setCreateForm(DEFAULT_FORM);
  };

  const openEdit = (cat: CategoryDetailResponse) => {
    setEditTarget(cat);
    setEditForm({
      name: cat.name,
      description: cat.description || "",
      type: cat.type || "GENERAL",
      displayOrder: cat.displayOrder ?? 100,
      recommendedLineId: cat.recommendedLineId ?? null,
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    updateCategory(editTarget.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      type: editForm.type,
      displayOrder: editForm.displayOrder,
      recommendedLineId: editForm.recommendedLineId,
    } as UpdateCategoryRequest);
    setEditTarget(null);
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Категории заявок
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Всего категорий: {categories.length}
          </Text>
        </Box>

        <Dialog.Root
          open={isCreateOpen}
          onOpenChange={(e) => setIsCreateOpen(e.open)}
          lazyMount
          unmountOnExit
        >
          <Dialog.Trigger asChild>
            <Button bg="gray.900" color="white" _hover={{ bg: "gray.800" }}>
              <LuPlus />
              Создать категорию
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="480px">
                <Dialog.Header>
                  <Dialog.Title>Новая категория</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <CategoryForm
                    form={createForm}
                    onChange={setCreateForm}
                    lineCollection={lineCollection}
                  />
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
                    disabled={!createForm.name.trim()}
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

      {/* Table */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : categories.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <LuTag size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Text color="fg.muted" mt={4}>
            Нет категорий
          </Text>
        </Box>
      ) : (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          overflow="hidden"
        >
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Название</Table.ColumnHeader>
                <Table.ColumnHeader>Тип</Table.ColumnHeader>
                <Table.ColumnHeader>Линия</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Действия</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categories.map((cat) => {
                const typeInfo = cat.type ? categoryTypeConfig[cat.type] : null;
                return (
                  <Table.Row key={cat.id}>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        <HStack gap={2}>
                          <Text fontWeight="medium">{cat.name}</Text>
                          <Badge colorPalette="blue" variant="subtle" size="sm">
                            #{cat.displayOrder}
                          </Badge>
                        </HStack>
                        {cat.description && (
                          <Text fontSize="sm" color="fg.muted">
                            {cat.description}
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      {typeInfo && (
                        <Badge colorPalette={typeInfo.color} variant="subtle" size="sm">
                          {typeInfo.label}
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {cat.recommendedLineName ? (
                        <Badge colorPalette="green" variant="subtle" size="sm">
                          {cat.recommendedLineName}
                        </Badge>
                      ) : (
                        <Text fontSize="sm" color="fg.muted">
                          —
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <IconButton variant="ghost" size="sm" aria-label="Действия">
                            <LuChevronDown />
                          </IconButton>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content minW="160px">
                              <Menu.Item value="edit" onClick={() => openEdit(cat)}>
                                <LuPencil /> Редактировать
                              </Menu.Item>
                              <Menu.Separator />
                              <Menu.Item
                                value="delete"
                                color="red.500"
                                onClick={() => setDeleteTarget(cat)}
                              >
                                <LuTrash2 /> Удалить
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Edit dialog */}
      <Dialog.Root
        open={!!editTarget}
        onOpenChange={(e) => { if (!e.open) setEditTarget(null); }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="480px">
              <Dialog.Header>
                <Dialog.Title>Редактировать категорию</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <CategoryForm
                  form={editForm}
                  onChange={setEditForm}
                  lineCollection={lineCollection}
                />
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  onClick={handleUpdate}
                  disabled={!editForm.name.trim()}
                  loading={isUpdating}
                >
                  Сохранить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete dialog */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(e) => { if (!e.open) setDeleteTarget(null); }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>Удалить категорию?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Категория <Text as="strong">«{deleteTarget?.name}»</Text> будет
                  деактивирована. Данные сохранятся в базе.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  onClick={() => { deleteCategory(deleteTarget!.id); setDeleteTarget(null); }}
                  loading={isDeleting}
                >
                  Удалить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}

// ─── Form ────────────────────────────────────────────────────────

function CategoryForm({
  form,
  onChange,
  lineCollection,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  lineCollection: ListCollection<{ value: string; label: string }>;
}) {
  const set = (patch: Partial<FormState>) => onChange({ ...form, ...patch });

  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={2}>
          Название <Text as="span" color="red.500">*</Text>
        </Text>
        <Input
          placeholder="Например: Проблема с оборудованием"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          maxLength={150}
        />
      </Box>

      <Box>
        <Text fontWeight="medium" mb={2}>
          Описание
        </Text>
        <Textarea
          placeholder="Краткое описание категории"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          maxLength={500}
        />
      </Box>

      <HStack gap={3}>
        <Box flex={1}>
          <Text fontWeight="medium" mb={2}>
            Тип
          </Text>
          <Select.Root
            collection={typeCollection}
            value={[form.type]}
            onValueChange={(e) => set({ type: (e.value[0] as CategoryType) || "GENERAL" })}
          >
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                {typeCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>

        <Box flex={1}>
          <Text fontWeight="medium" mb={2}>
            Порядок
          </Text>
          <Input
            type="number"
            value={form.displayOrder}
            onChange={(e) => set({ displayOrder: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </Box>
      </HStack>

      <Box>
        <Text fontWeight="medium" mb={2}>
          Рекомендуемая линия поддержки
        </Text>
        <Select.Root
          collection={lineCollection}
          value={form.recommendedLineId ? [form.recommendedLineId.toString()] : [""]}
          onValueChange={(e) =>
            set({ recommendedLineId: e.value[0] ? parseInt(e.value[0]) : null })
          }
        >
          <Select.Trigger>
            <Select.ValueText />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Content>
              {lineCollection.items.map((item: any) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
        <Text fontSize="xs" color="fg.muted" mt={1}>
          Линия, на которую будет автоматически направлен тикет
        </Text>
      </Box>
    </VStack>
  );
}
