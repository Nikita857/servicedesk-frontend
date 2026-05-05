"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Button,
  createListCollection,
} from "@chakra-ui/react";
import { LuDownload } from "react-icons/lu";
import { BackButton } from "@/components/ui";
import { DataSelect } from "@/components/ui/DataSelect";
import { adminApi } from "@/lib/api/admin";
import { reportsApi } from "@/lib/api/reports";
import { handleApiError, toast } from "@/lib/utils";
import type { DepartmentResponse } from "@/types/admin";
import axios from "axios";

const MONTHS = [
  { label: "Январь", value: "1" },
  { label: "Февраль", value: "2" },
  { label: "Март", value: "3" },
  { label: "Апрель", value: "4" },
  { label: "Май", value: "5" },
  { label: "Июнь", value: "6" },
  { label: "Июль", value: "7" },
  { label: "Август", value: "8" },
  { label: "Сентябрь", value: "9" },
  { label: "Октябрь", value: "10" },
  { label: "Ноябрь", value: "11" },
  { label: "Декабрь", value: "12" },
];
const monthCollection = createListCollection({ items: MONTHS });

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => ({
  label: String(2025 + i),
  value: String(2025 + i),
}));
const yearCollection = createListCollection({ items: YEARS });

export default function ScheduledTasksReportPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchDepts() {
      setIsLoadingDepts(true);
      try {
        const data = await adminApi.getDepartments();
        setDepartments(data);
      } catch (e) {
        handleApiError(e, { context: "Загрузить список отделов" });
      } finally {
        setIsLoadingDepts(false);
      }
    }
    fetchDepts();
  }, []);

  const deptCollection = createListCollection({
    items: departments.map((d) => ({ label: d.name, value: String(d.id) })),
  });

  const isValid = departmentId !== "" && month !== "" && year !== "";

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await reportsApi.downloadScheduledTaskReport(
        Number(departmentId),
        Number(year),
        Number(month),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scheduled-tasks-${year}-${String(month).padStart(2, "0")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text) as { message?: string };
          toast.warning("Не найдено", json.message ?? "Нет данных для отчёта");
        } catch {
          handleApiError(e, { context: "Скачать отчёт" });
        }
        return;
      }
      handleApiError(e, { context: "Скачать отчёт" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box>
      <Box mb={6}>
        <BackButton href="/dashboard/reports" label="Назад к отчётам" mb={2} />
        <Heading size="xl" color="fg.default" mb={2}>
          Отчёт: запланированные задания
        </Heading>
        <Text color="fg.muted">
          Выберите отдел и месяц — получите XLSX с заданиями за этот период
        </Text>
      </Box>

      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={6}
      >
        <VStack align="stretch" gap={5} maxW="480px">
          <DataSelect
            label="Отдел"
            collection={deptCollection}
            placeholder={isLoadingDepts ? "Загрузка..." : "Выберите отдел"}
            value={departmentId ? [departmentId] : []}
            onValueChange={(e) => setDepartmentId(e.value[0] ?? "")}
            disabled={isLoadingDepts}
          />

          <SimpleGrid columns={2} gap={4}>
            <DataSelect
              label="Месяц"
              collection={monthCollection}
              placeholder="Выберите месяц"
              value={month ? [month] : []}
              onValueChange={(e) => setMonth(e.value[0] ?? "")}
            />
            <DataSelect
              label="Год"
              collection={yearCollection}
              placeholder="Выберите год"
              value={year ? [year] : []}
              onValueChange={(e) => setYear(e.value[0] ?? "")}
            />
          </SimpleGrid>

          <Button
            colorPalette="purple"
            disabled={!isValid}
            loading={isDownloading}
            onClick={handleDownload}
          >
            <LuDownload />
            Скачать XLSX
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
