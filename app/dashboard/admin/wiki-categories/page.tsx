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
  Input,
  Dialog,
  createListCollection,
  Textarea,
  Portal,
  IconButton,
} from "@chakra-ui/react";
import { DataSelect, BackButton, CategoryTreeSelect } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { LuPlus, LuX } from "react-icons/lu";

import { useWikiCategoriesAdmin } from "@/lib/hooks";
import { adminApi, Department } from "@/lib/api/admin";
import {
  WikiCategoryTree,
  CreateWikiCategoryRequest,
  UpdateWikiCategoryRequest,
} from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { CategoryTree } from "@/components/features/wiki/CategoryTree";

export default function WikiCategoriesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.roles?.includes("ADMIN") || false;

  const {
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
  } = useWikiCategoriesAdmin();

  // Fetch departments for the department selector
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
  });

  // Fetch category tree
  const { data: treeData = [], isLoading: isLoadingTree } = useQuery({
    queryKey: ["admin", "categoriesTree"],
    queryFn: () => adminApi.getCategoriesTree(),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<WikiCategoryTree | null>(null);
  const [formData, setFormData] = useState<CreateWikiCategoryRequest>({
    name: "",
    description: "",
    departmentId: undefined,
    parentId: undefined,
    displayOrder: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

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
    [departments],
  );

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      departmentId: undefined,
      parentId: undefined,
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (node: WikiCategoryTree) => {
    setEditingCategory(node);
    setFormData({
      name: node.name,
      description: node.description || "",
      departmentId: node.departmentId || undefined,
      parentId: node.parentId || undefined,
      displayOrder: node.displayOrder || 0,
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

  // Filter tree by search term
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return treeData;

    const term = searchTerm.toLowerCase();

    const filterNodes = (nodes: WikiCategoryTree[]): WikiCategoryTree[] => {
      return nodes.reduce<WikiCategoryTree[]>((acc, node) => {
        const nameMatch = node.name.toLowerCase().includes(term);
        const descMatch = node.description?.toLowerCase().includes(term);
        const filteredChildren = node.children?.length
          ? filterNodes(node.children)
          : [];

        if (nameMatch || descMatch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children:
              filteredChildren.length > 0
                ? filteredChildren
                : node.children || [],
          });
        }
        return acc;
      }, []);
    };

    return filterNodes(treeData);
  }, [treeData, searchTerm]);

  // Redirect non-admins
  if (!isAdmin) {
    router.push("/dashboard");
    return null;
  }

  if (isLoading || isLoadingTree) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

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

        <CategoryTree
          data={filteredTree}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
                    <CategoryTreeSelect
                      label="Родительская категория (опционально)"
                      data={treeData}
                      value={formData.parentId ?? undefined}
                      onChange={(parentId) =>
                        setFormData((prev) => ({ ...prev, parentId }))
                      }
                      placeholder="Выберите родительскую категорию"
                      helperText="Если не выбрана, категория будет корневой"
                      isLoading={isLoadingTree}
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
                      disabled={isLoadingDepts}
                      portalled={false}
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
