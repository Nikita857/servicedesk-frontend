"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Button,
  IconButton,
  Input,
  Textarea,
  Badge,
  Separator,
  Portal,
  Dialog,
  Menu,
  VStack,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuChevronRight,
  LuChevronDown,
  LuPencil,
  LuTrash2,
  LuBuilding2,
} from "react-icons/lu";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  usePositionsByDepartment,
  useCreatePosition,
  useDeletePosition,
} from "@/lib/hooks/departments/useDepartments";
import type { DepartmentResponse, PositionResponse } from "@/types/department";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartments();

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [createDeptOpen, setCreateDeptOpen] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentResponse | null>(null);
  const [deleteDept, setDeleteDept] = useState<DepartmentResponse | null>(null);
  const [addPosDeptId, setAddPosDeptId] = useState<number | null>(null);
  const [deletePos, setDeletePos] = useState<PositionResponse | null>(null);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const createDept = useCreateDepartment();
  const deleteDeptMutation = useDeleteDepartment();

  const [deptForm, setDeptForm] = useState({ name: "", description: "" });

  const handleCreateDept = () => {
    createDept.mutate(
      { name: deptForm.name.trim(), description: deptForm.description.trim() },
      {
        onSuccess: () => {
          setCreateDeptOpen(false);
          setDeptForm({ name: "", description: "" });
        },
      },
    );
  };

  const openEdit = (dept: DepartmentResponse) => {
    setEditDept(dept);
    setDeptForm({ name: dept.name, description: dept.description ?? "" });
  };

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Отделы и должности
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Всего отделов: {departments.length}
          </Text>
        </Box>

        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => {
            setDeptForm({ name: "", description: "" });
            setCreateDeptOpen(true);
          }}
        >
          <LuPlus />
          Создать отдел
        </Button>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : departments.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <LuBuilding2 size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Text color="fg.muted" mt={4}>
            Нет отделов
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
          {departments.map((dept, idx) => (
            <Box key={dept.id}>
              {idx > 0 && <Separator />}

              {/* Department row */}
              <Flex
                px={4}
                py={3}
                align="center"
                gap={3}
                _hover={{ bg: "bg.subtle" }}
                transition="background 0.15s"
              >
                <IconButton
                  variant="ghost"
                  size="xs"
                  aria-label={expanded.has(dept.id) ? "Свернуть" : "Развернуть"}
                  onClick={() => toggle(dept.id)}
                  color="fg.muted"
                >
                  {expanded.has(dept.id) ? (
                    <LuChevronDown size={16} />
                  ) : (
                    <LuChevronRight size={16} />
                  )}
                </IconButton>

                <Box flex={1} minW={0}>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="medium" color="fg.default">
                      {dept.name}
                    </Text>
                    {(dept.positionCount ?? 0) > 0 && (
                      <Badge colorPalette="blue" variant="subtle" size="sm">
                        {dept.positionCount} должн.
                      </Badge>
                    )}
                  </Flex>
                  {dept.description && (
                    <Text
                      fontSize="sm"
                      color="fg.muted"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {dept.description}
                    </Text>
                  )}
                </Box>

                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label="Действия"
                      color="fg.muted"
                    >
                      <LuChevronDown size={16} />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content minW="160px">
                        <Menu.Item value="edit" onClick={() => openEdit(dept)}>
                          <LuPencil /> Редактировать
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item
                          value="delete"
                          color="red.500"
                          onClick={() => setDeleteDept(dept)}
                        >
                          <LuTrash2 /> Удалить
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>

              {/* Positions section (lazy-loaded on expand) */}
              {expanded.has(dept.id) && (
                <PositionsSection
                  deptId={dept.id}
                  onAddPosition={() => setAddPosDeptId(dept.id)}
                  onDeletePosition={setDeletePos}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Create Department */}
      <Dialog.Root
        open={createDeptOpen}
        onOpenChange={(e) => setCreateDeptOpen(e.open)}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="440px">
              <Dialog.Header>
                <Dialog.Title>Новый отдел</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <DeptForm form={deptForm} onChange={setDeptForm} />
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  bg="gray.900"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  disabled={!deptForm.name.trim()}
                  loading={createDept.isPending}
                  onClick={handleCreateDept}
                >
                  Создать
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Edit Department */}
      {editDept && (
        <EditDeptDialog
          dept={editDept}
          form={deptForm}
          onChange={setDeptForm}
          onClose={() => setEditDept(null)}
        />
      )}

      {/* Delete Department */}
      <Dialog.Root
        open={!!deleteDept}
        onOpenChange={(e) => {
          if (!e.open) setDeleteDept(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>Удалить отдел?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Отдел <Text as="strong">«{deleteDept?.name}»</Text> будет
                  удалён. Отдел не должен содержать должностей.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  loading={deleteDeptMutation.isPending}
                  onClick={() => {
                    if (!deleteDept) return;
                    deleteDeptMutation.mutate(deleteDept.id, {
                      onSuccess: () => setDeleteDept(null),
                    });
                  }}
                >
                  Удалить
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Add Position */}
      {addPosDeptId !== null && (
        <AddPositionDialog
          deptId={addPosDeptId}
          onClose={() => setAddPosDeptId(null)}
        />
      )}

      {/* Delete Position */}
      <Dialog.Root
        open={!!deletePos}
        onOpenChange={(e) => {
          if (!e.open) setDeletePos(null);
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px">
              <Dialog.Header>
                <Dialog.Title>Удалить должность?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Должность <Text as="strong">«{deletePos?.name}»</Text> будет
                  удалена.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Отмена</Button>
                </Dialog.ActionTrigger>
                <DeletePositionButton
                  pos={deletePos}
                  onSuccess={() => setDeletePos(null)}
                />
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}

// ─── PositionsSection ─────────────────────────────────────────────────────────

interface PositionsSectionProps {
  deptId: number;
  onAddPosition: () => void;
  onDeletePosition: (pos: PositionResponse) => void;
}

function PositionsSection({
  deptId,
  onAddPosition,
  onDeletePosition,
}: PositionsSectionProps) {
  const { data: positions = [], isLoading } = usePositionsByDepartment(deptId);

  return (
    <Box bg="bg.subtle" borderTopWidth="1px" borderColor="border.default">
      {isLoading ? (
        <Flex justify="center" py={4}>
          <Spinner size="sm" />
        </Flex>
      ) : (
        <VStack gap={0} align="stretch">
          {positions.map((pos) => (
            <Flex
              key={pos.id}
              px={4}
              py={2.5}
              pl={12}
              align="center"
              gap={3}
              _hover={{ bg: "bg.muted" }}
              transition="background 0.1s"
            >
              <Text fontSize="sm" flex={1} color="fg.default">
                {pos.name}
              </Text>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="xs"
                    aria-label="Действия"
                    color="fg.muted"
                  >
                    <LuChevronDown size={14} />
                  </IconButton>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content minW="140px">
                      <Menu.Item
                        value="delete"
                        color="red.500"
                        onClick={() => onDeletePosition(pos)}
                      >
                        <LuTrash2 /> Удалить
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Flex>
          ))}

          <Flex px={4} py={2} pl={10}>
            <Button
              variant="ghost"
              size="sm"
              color="fg.muted"
              _hover={{ color: "fg.default", bg: "bg.muted" }}
              onClick={onAddPosition}
            >
              <LuPlus size={14} />
              Добавить должность
            </Button>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}

// ─── EditDeptDialog ───────────────────────────────────────────────────────────

interface EditDeptDialogProps {
  dept: DepartmentResponse;
  form: { name: string; description: string };
  onChange: (f: { name: string; description: string }) => void;
  onClose: () => void;
}

function EditDeptDialog({
  dept,
  form,
  onChange,
  onClose,
}: EditDeptDialogProps) {
  const update = useUpdateDepartment(dept.id);

  const handleSave = () => {
    update.mutate(
      { name: form.name.trim(), description: form.description.trim() },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="440px">
            <Dialog.Header>
              <Dialog.Title>Редактировать отдел</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <DeptForm form={form} onChange={onChange} />
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Отмена</Button>
              </Dialog.ActionTrigger>
              <Button
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
                disabled={!form.name.trim()}
                loading={update.isPending}
                onClick={handleSave}
              >
                Сохранить
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ─── AddPositionDialog ────────────────────────────────────────────────────────

interface AddPositionDialogProps {
  deptId: number;
  onClose: () => void;
}

function AddPositionDialog({ deptId, onClose }: AddPositionDialogProps) {
  const [name, setName] = useState("");
  const create = useCreatePosition();

  const handleCreate = () => {
    create.mutate(
      { name: name.trim(), departmentId: deptId },
      {
        onSuccess: () => {
          onClose();
          setName("");
        },
      },
    );
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="400px">
            <Dialog.Header>
              <Dialog.Title>Добавить должность</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Название{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="Например: Разработчик"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) handleCreate();
                  }}
                />
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Отмена</Button>
              </Dialog.ActionTrigger>
              <Button
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
                disabled={!name.trim()}
                loading={create.isPending}
                onClick={handleCreate}
              >
                Добавить
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

// ─── DeletePositionButton ─────────────────────────────────────────────────────

function DeletePositionButton({
  pos,
  onSuccess,
}: {
  pos: PositionResponse | null;
  onSuccess: () => void;
}) {
  const del = useDeletePosition();
  return (
    <Button
      colorPalette="red"
      loading={del.isPending}
      onClick={() => {
        if (!pos) return;
        del.mutate(pos.id, { onSuccess });
      }}
    >
      Удалить
    </Button>
  );
}

// ─── DeptForm ─────────────────────────────────────────────────────────────────

interface DeptFormProps {
  form: { name: string; description: string };
  onChange: (f: { name: string; description: string }) => void;
}

function DeptForm({ form, onChange }: DeptFormProps) {
  const set = (patch: Partial<typeof form>) => onChange({ ...form, ...patch });
  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontWeight="medium" mb={2}>
          Название{" "}
          <Text as="span" color="red.500">
            *
          </Text>
        </Text>
        <Input
          placeholder="Например: IT-отдел"
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
          placeholder="Краткое описание отдела"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={3}
          maxLength={500}
        />
      </Box>
    </VStack>
  );
}
