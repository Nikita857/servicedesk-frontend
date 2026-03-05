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
  Textarea,
  Portal,
  IconButton,
  Checkbox,
  Badge,
} from "@chakra-ui/react";
import { BackButton, CategoryTreeSelect } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { LuPlus, LuX } from "react-icons/lu";

import { useWikiCategoriesAdmin } from "@/lib/hooks";
import { adminApi } from "@/lib/api/admin";
import type { DepartmentResponse } from "@/types/admin";
import type {
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
    departmentIds: [],
    parentId: undefined,
    displayOrder: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      departmentIds: [],
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
      departmentIds: node.departments.map((d) => d.id),
      parentId: node.parentId || undefined,
      displayOrder: node.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const toggleDepartment = (deptId: number) => {
    setFormData((prev) => {
      const current = (prev.departmentIds as number[]) ?? [];
      const next = current.includes(deptId)
        ? current.filter((id) => id !== deptId)
        : [...current, deptId];
      return { ...prev, departmentIds: next };
    });
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
    <Box p={{ base: 3, md: 6 }}>
      <Flex
        justify="space-between"
        align={{ base: "start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap={3}
        mb={6}
      >
        <VStack align="start" gap={1}>
          <HStack mb={2}>
            <BackButton href="/dashboard/wiki" />
          </HStack>
          <Heading size={{ base: "md", md: "lg" }}>
            Управление категориями Wiki
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "sm", md: "md" }}>
            Создание и редактирование категорий для статей базы знаний
          </Text>
        </VStack>
        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          size={{ base: "sm", md: "md" }}
          flexShrink={0}
          onClick={handleCreateNew}
        >
          <LuPlus /> Добавить категорию
        </Button>
      </Flex>

      <Box
        bg="bg.surface"
        p={{ base: 3, md: 4 }}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Box mb={4}>
          <Input
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW={{ base: "full", md: "400px" }}
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
        size={{ base: "full", md: "md" }}
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
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      Отделы (опционально)
                    </Text>
                    <Text fontSize="xs" color="fg.muted" mb={2}>
                      Если не выбрано — категория публичная (видна всем)
                    </Text>
                    {(formData.departmentIds as number[])?.length > 0 && (
                      <HStack wrap="wrap" mb={2} gap={1}>
                        {(formData.departmentIds as number[]).map((id) => {
                          const dept = departments.find((d: DepartmentResponse) => d.id === id);
                          return dept ? (
                            <Badge key={id} size="sm" colorPalette="blue">
                              {dept.name}
                            </Badge>
                          ) : null;
                        })}
                      </HStack>
                    )}
                    <Box
                      maxH="160px"
                      overflowY="auto"
                      borderWidth="1px"
                      borderColor="border.default"
                      borderRadius="md"
                      p={2}
                    >
                      {isLoadingDepts ? (
                        <Spinner size="sm" />
                      ) : (
                        <VStack align="start" gap={2}>
                          {departments.map((d: DepartmentResponse) => (
                            <Checkbox.Root
                              key={d.id}
                              checked={(formData.departmentIds as number[])?.includes(d.id)}
                              onCheckedChange={() => toggleDepartment(d.id)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label fontSize="sm">{d.name}</Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </VStack>
                      )}
                    </Box>
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
