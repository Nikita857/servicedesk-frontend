"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  VStack,
  HStack,
  Badge,
  Input,
  Table,
  Dialog,
  createListCollection,
  Textarea,
  Stack,
  Portal,
  IconButton,
} from "@chakra-ui/react";
import Link from "next/link";
import { DataSelect, BackButton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import {
  LuPlus,
  LuPencil,
  LuTrash,
  LuBuilding,
  LuArrowUpDown,
  LuArrowUp,
  LuArrowDown,
  LuX,
} from "react-icons/lu";

import { useWikiCategoriesAdmin } from "@/lib/hooks";
import { adminApi, Department } from "@/lib/api/admin";
import {
  WikiCategory,
  CreateWikiCategoryRequest,
  UpdateWikiCategoryRequest,
} from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";

export default function WikiCategoriesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.roles?.includes("ADMIN") || false;

  // Redirect non-admins
  if (!isAdmin) {
    router.push("/dashboard");
    return null;
  }

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useWikiCategoriesAdmin();

  // Fetch departments for the department selector
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(
    null
  );
  const [formData, setFormData] = useState<CreateWikiCategoryRequest>({
    name: "",
    description: "",
    departmentId: undefined,
    displayOrder: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof WikiCategory;
    direction: "asc" | "desc";
  }>({
    key: "displayOrder",
    direction: "asc",
  });

  // Department collection for Select
  const departmentCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Публичная (все отделы)", value: "0" },
          ...departments.map((d: Department) => ({
            label: d.name,
            value: d.id.toString(),
          })),
        ],
      }),
    [departments]
  );

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      departmentId: undefined,
      displayOrder: (categories?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: WikiCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      departmentId: category.departmentId || undefined,
      displayOrder: category.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCategory) {
      updateCategory(editingCategory.id, formData as UpdateWikiCategoryRequest);
    } else {
      createCategory(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Вы уверены, что хотите удалить эту категорию?")) {
      await deleteCategory(id);
    }
  };

  const handleSort = (key: keyof WikiCategory) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedCategories = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const comparison = (aValue ?? "") < (bValue ?? "") ? -1 : 1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
  }, [categories, searchTerm, sortConfig]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  const SortIcon = ({ column }: { column: keyof WikiCategory }) => {
    if (sortConfig.key !== column) return <LuArrowUpDown />;
    return sortConfig.direction === "asc" ? <LuArrowUp /> : <LuArrowDown />;
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" gap={1}>
          <HStack mb={2}>
            <BackButton href="/dashboard/wiki" />
          </HStack>
          <Heading size="lg">Управление категориями Wiki</Heading>
          <Text color="fg.muted">
            Создание и редактирование категорий для статей базы знаний
          </Text>
        </VStack>
        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={handleCreateNew}
        >
          <LuPlus /> Добавить категорию
        </Button>
      </Flex>

      <Box
        bg="bg.surface"
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Box mb={4}>
          <Input
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="400px"
          />
        </Box>

        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                cursor="pointer"
                onClick={() => handleSort("displayOrder")}
                width="80px"
              >
                <HStack gap={1}>
                  # <SortIcon column="displayOrder" />
                </HStack>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                cursor="pointer"
                onClick={() => handleSort("name")}
              >
                <HStack gap={1}>
                  Название <SortIcon column="name" />
                </HStack>
              </Table.ColumnHeader>
              <Table.ColumnHeader>Описание</Table.ColumnHeader>
              <Table.ColumnHeader>Доступ</Table.ColumnHeader>
              <Table.ColumnHeader width="120px">Действия</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAndSortedCategories.map((category) => (
              <Table.Row key={category.id}>
                <Table.Cell>{category.displayOrder}</Table.Cell>
                <Table.Cell fontWeight="medium">{category.name}</Table.Cell>
                <Table.Cell color="fg.muted" maxW="300px" truncate>
                  {category.description || "—"}
                </Table.Cell>
                <Table.Cell>
                  {category.departmentId ? (
                    <Badge colorPalette="blue" variant="subtle">
                      <LuBuilding size={12} style={{ marginRight: "4px" }} />
                      {departments.find(
                        (d: Department) => d.id === category.departmentId
                      )?.name || "Отдел"}
                    </Badge>
                  ) : (
                    <Badge colorPalette="green" variant="subtle">
                      Публичная
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={2}>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleEdit(category)}
                      title="Редактировать"
                    >
                      <LuPencil />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      colorPalette="red"
                      onClick={() => handleDelete(category.id)}
                      disabled={isDeleting}
                      title="Удалить"
                    >
                      <LuTrash />
                    </IconButton>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
            {filteredAndSortedCategories.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center" py={8}>
                  <Text color="fg.muted">Категории не найдены</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(e) => setIsDialogOpen(e.open)}
        size="md"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {editingCategory
                    ? "Редактировать категорию"
                    : "Добавить категорию"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      Название *
                    </Text>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Введите название категории"
                    />
                  </Box>

                  <Box>
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      Описание
                    </Text>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Краткое описание категории"
                    />
                  </Box>

                  <Box>
                    <DataSelect
                      label="Отдел (опционально)"
                      collection={departmentCollection}
                      value={
                        formData.departmentId
                          ? [formData.departmentId.toString()]
                          : ["0"]
                      }
                      onValueChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          departmentId:
                            e.value[0] === "0"
                              ? undefined
                              : parseInt(e.value[0]),
                        }))
                      }
                      helperText="Если отдел не выбран, категория будет публичной"
                    />
                  </Box>

                  <Box>
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      Порядок отображения
                    </Text>
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOrder: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={0}
                    />
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  onClick={handleSave}
                  disabled={!formData.name || isCreating || isUpdating}
                  loading={isCreating || isUpdating}
                >
                  {editingCategory ? "Сохранить" : "Создать"}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close"
                  onClick={() => setIsDialogOpen(false)}
                  position="absolute"
                  top="2"
                  right="2"
                >
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
