import { AdminUser, adminApi } from "@/lib/api/admin";
import {
  Button,
  CloseButton,
  Portal,
  Dialog,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { DataSelect } from "@/components/ui/DataSelect";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useRef } from "react";

interface EditOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: AdminUser | null;
  departmentId: number | null;
  setDepartmentId: (id: number | null) => void;
  positionId: number | null;
  setPositionId: (id: number | null) => void;
  handleSave: () => Promise<void>;
  isSubmitting: boolean;
}

export default function EditOrgModal({
  isOpen,
  onClose,
  selectedUser,
  departmentId,
  setDepartmentId,
  positionId,
  setPositionId,
  handleSave,
  isSubmitting,
}: EditOrgModalProps) {
  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
    enabled: isOpen,
  });

  // Fetch positions for selected department
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["admin", "positions", departmentId],
    queryFn: () => adminApi.getPositionsByDepartment(departmentId!),
    enabled: isOpen && !!departmentId,
  });

  const deptCollection = useMemo(
    () =>
      createListCollection({
        items: departments.map((d) => ({
          label: d.name,
          value: d.id.toString(),
        })),
      }),
    [departments],
  );

  const posCollection = useMemo(
    () =>
      createListCollection({
        items: positions.map((p) => ({
          label: p.name,
          value: p.id.toString(),
        })),
      }),
    [positions],
  );

  const hasInitializedOrg = useRef(false);

  // Initialize org IDs from selectedUser names
  useEffect(() => {
    if (
      selectedUser &&
      departments.length > 0 &&
      !hasInitializedOrg.current &&
      isOpen
    ) {
      const dept = departments.find(
        (d) => d.name === selectedUser.departmentName,
      );
      if (dept) {
        setDepartmentId(dept.id);
      } else {
        hasInitializedOrg.current = true;
      }
    }
  }, [selectedUser, departments, isOpen, setDepartmentId]);

  useEffect(() => {
    if (
      selectedUser &&
      positions.length > 0 &&
      !hasInitializedOrg.current &&
      isOpen
    ) {
      const pos = positions.find((p) => p.name === selectedUser.positionName);
      if (pos) {
        setPositionId(pos.id);
      }
      hasInitializedOrg.current = true;
    }
  }, [selectedUser, positions, isOpen, setPositionId]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitializedOrg.current = false;
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                Организация: {selectedUser?.fio || selectedUser?.username}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <DataSelect
                  label="Отдел"
                  placeholder={
                    isLoadingDepts ? "Загрузка..." : "Выберите отдел"
                  }
                  collection={deptCollection}
                  value={departmentId ? [departmentId.toString()] : []}
                  onValueChange={(e) => {
                    const id = e.value[0] ? parseInt(e.value[0]) : null;
                    setDepartmentId(id);
                    setPositionId(null);
                  }}
                  disabled={isLoadingDepts}
                  portalled={false}
                />

                <DataSelect
                  label="Должность"
                  placeholder={
                    !departmentId
                      ? "Сначала выберите отдел"
                      : isLoadingPositions
                        ? "Загрузка..."
                        : "Выберите должность"
                  }
                  collection={posCollection}
                  value={positionId ? [positionId.toString()] : []}
                  onValueChange={(e) => {
                    const id = e.value[0] ? parseInt(e.value[0]) : null;
                    setPositionId(id);
                  }}
                  disabled={!departmentId || isLoadingPositions}
                  portalled={false}
                />
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                bg="gray.900"
                color="white"
                onClick={handleSave}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Сохранить
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
