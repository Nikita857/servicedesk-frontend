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
  Portal,
  CloseButton,
  createListCollection,
  Select,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  LuPlus,
  LuPencil,
  LuTrash,
  LuBuilding,
  LuArrowUpDown,
  LuArrowUp,
  LuArrowDown,
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

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: async () => {
      const response = await adminApi.getDepartments();
      return Array.isArray(response) ? response : [];
    },
  });

  const departmentCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Публичная (все отделы)", value: "public" },
          ...departments.map((d: Department) => ({
            label: d.name,
            value: d.id.toString(),
          })),
        ],
      }),
    [departments]
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WikiCategory | null>(
    null
  );
  const [formData, setFormData] = useState<CreateWikiCategoryRequest>({
    name: "",
    description: "",
    departmentId: null,
    displayOrder: 0,
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      departmentId: null,
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: WikiCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      departmentId: category.departmentId,
      displayOrder: category.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCategory) {
      updateCategory(editingCategory.id, formData as UpdateWikiCategoryRequest);
    } else {
      createCategory(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Вы уверены, что хотите удалить эту категорию?")) {
      deleteCategory(id);
    }
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "departmentName" | "displayOrder";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const sortedCategories = useMemo(() => {
    const sortable = [...categories];
    sortable.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortConfig.key === "departmentName") {
        valA = a.departmentName || " Публичная"; // Space for better sorting (Public first)
        valB = b.departmentName || " Публичная";
      } else {
        // @ts-ignore - access by key
        valA = a[sortConfig.key] ?? "";
        // @ts-ignore
        valB = b[sortConfig.key] ?? "";
      }

      if (valA < valB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortable;
  }, [categories, sortConfig]);

  const requestSort = (key: typeof sortConfig.key) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: typeof sortConfig.key) => {
    if (sortConfig.key !== key) return <LuArrowUpDown size={12} />;
    return sortConfig.direction === "asc" ? (
      <LuArrowUp size={12} />
    ) : (
      <LuArrowDown size={12} />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Категории Wiki
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление категориями статей базы знаний
          </Text>
        </Box>

        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={openCreateDialog}
        >
          <LuPlus />
          Добавить категорию
        </Button>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : categories.length === 0 ? (
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
          <Text color="fg.muted">Нет категорий</Text>
          <Button mt={4} variant="outline" onClick={openCreateDialog}>
            <LuPlus />
            Создать первую категорию
          </Button>
        </Flex>
      ) : (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          overflow="hidden"
        >
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader
                  cursor="pointer"
                  onClick={() => requestSort("name")}
                  _hover={{ bg: "bg.subtle" }}
                >
                  <HStack gap={1}>
                    <Text>Название</Text>
                    {getSortIcon("name")}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader>Описание</Table.ColumnHeader>
                <Table.ColumnHeader
                  cursor="pointer"
                  onClick={() => requestSort("departmentName")}
                  _hover={{ bg: "bg.subtle" }}
                >
                  <HStack gap={1}>
                    <Text>Отдел</Text>
                    {getSortIcon("departmentName")}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  cursor="pointer"
                  onClick={() => requestSort("displayOrder")}
                  _hover={{ bg: "bg.subtle" }}
                >
                  <HStack gap={1}>
                    <Text>Порядок</Text>
                    {getSortIcon("displayOrder")}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">
                  Действия
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedCategories.map((category) => (
                <Table.Row key={category.id}>
                  <Table.Cell fontWeight="medium">{category.name}</Table.Cell>
                  <Table.Cell color="fg.muted">
                    {category.description || "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {category.departmentName ? (
                      <HStack gap={1}>
                        <LuBuilding size={14} />
                        <Text>{category.departmentName}</Text>
                      </HStack>
                    ) : (
                      <Badge colorPalette="green" variant="subtle">
                        Публичная
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">{category.displayOrder}</Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <HStack justify="flex-end" gap={1}>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openEditDialog(category)}
                      >
                        <LuPencil size={14} />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(category.id)}
                        disabled={isDeleting}
                      >
                        <LuTrash size={14} />
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(details: { open: boolean }) =>
          setIsDialogOpen(details.open)
        }
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {editingCategory
                    ? "Редактировать категорию"
                    : "Новая категория"}
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
                    <Input
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
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      Отдел
                    </Text>
                    <Select.Root
                      key={`dept-select-${departments.length}`}
                      collection={departmentCollection}
                      value={
                        formData.departmentId
                          ? [formData.departmentId.toString()]
                          : ["public"]
                      }
                      onValueChange={(details) =>
                        setFormData((prev) => ({
                          ...prev,
                          departmentId:
                            details.value[0] === "public"
                              ? null
                              : parseInt(details.value[0]),
                        }))
                      }
                      disabled={isLoadingDepts}
                    >
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Выберите отдел" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content zIndex="popover">
                          {departmentCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
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
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
