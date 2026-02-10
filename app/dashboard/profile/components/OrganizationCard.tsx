"use client";

import { Box, VStack, HStack, Heading, Button, Icon } from "@chakra-ui/react";
import { LuHouse, LuSave } from "react-icons/lu";
import { DataSelect } from "@/components/ui/DataSelect";
import { ListCollection } from "@chakra-ui/react";

interface OrganizationCardProps {
  departmentId: number | null;
  setDepartmentId: (id: number | null) => void;
  positionId: number | null;
  setPositionId: (id: number | null) => void;
  deptCollection: ListCollection<{ label: string; value: string }>;
  posCollection: ListCollection<{ label: string; value: string }>;
  isLoadingDepts: boolean;
  isLoadingPositions: boolean;
  onUpdate: () => void;
  isPending: boolean;
}

export function OrganizationCard({
  departmentId,
  setDepartmentId,
  positionId,
  setPositionId,
  deptCollection,
  posCollection,
  isLoadingDepts,
  isLoadingPositions,
  onUpdate,
  isPending,
}: OrganizationCardProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={6}
      height="100%"
    >
      <HStack mb={4}>
        <Icon as={LuHouse} color="green.500" />
        <Heading size="md">Организация</Heading>
      </HStack>

      <VStack gap={4} align="stretch">
        <DataSelect
          label="Отдел"
          placeholder={isLoadingDepts ? "Загрузка..." : "Выберите отдел"}
          collection={deptCollection}
          value={departmentId ? [departmentId.toString()] : []}
          onValueChange={(e) => {
            const id = e.value[0] ? parseInt(e.value[0]) : null;
            setDepartmentId(id);
            setPositionId(null);
          }}
          disabled={true}
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
          disabled={true}
          portalled={false}
        />

        <Button
          colorPalette="green"
          onClick={onUpdate}
          loading={isPending}
          disabled={true}
          mt="auto"
        >
          <Icon as={LuSave} mr={2} />
          Обновить данные
        </Button>
      </VStack>
    </Box>
  );
}
