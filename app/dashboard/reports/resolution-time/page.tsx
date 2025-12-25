"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Flex,
  Spinner,
  SimpleGrid,
  Icon,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuClock,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
  LuCheckCheck,
} from "react-icons/lu";
import Link from "next/link";
import { reportsApi, type ResolutionTimeStats } from "@/lib/api/reports";
import { toast } from "@/lib/utils";

export default function ResolutionTimeReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ResolutionTimeStats | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await reportsApi.getResolutionTimeStats();
      setData(result);
    } catch (error) {
      toast.error("Ошибка", "Не удалось загрузить статистику");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}с`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}д ${remainingHours}ч`;
    }
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm" mb={2}>
            <LuArrowLeft />
            Назад к отчётам
          </Button>
        </Link>
        <Heading size="xl" color="fg.default" mb={2}>
          Время решения тикетов
        </Heading>
        <Text color="fg.muted">Статистика по времени решения тикетов</Text>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      )}

      {/* Results */}
      {data && !isLoading && (
        <VStack gap={6} align="stretch">
          {/* Total Resolved Card */}
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <Flex align="center" gap={4}>
              <Box p={4} borderRadius="xl" bg="green.subtle">
                <Icon as={LuCheckCheck} boxSize={8} color="green.600" />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontSize="sm" color="fg.muted">
                  Всего решено тикетов
                </Text>
                <Text fontSize="3xl" fontWeight="bold" color="fg.default">
                  {data.totalResolved.toLocaleString("ru-RU")}
                </Text>
              </VStack>
            </Flex>
          </Box>

          {/* Time Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={5}>
            {/* Average */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <Flex align="center" gap={3} mb={3}>
                <Box p={2} borderRadius="lg" bg="blue.subtle">
                  <Icon as={LuClock} boxSize={5} color="blue.600" />
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Среднее время
                </Text>
              </Flex>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {data.formattedAvgTime || formatTime(data.avgResolutionSeconds)}
              </Text>
            </Box>

            {/* Median */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <Flex align="center" gap={3} mb={3}>
                <Box p={2} borderRadius="lg" bg="purple.subtle">
                  <Icon as={LuMinus} boxSize={5} color="purple.600" />
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Медиана
                </Text>
              </Flex>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {formatTime(data.medianResolutionSeconds)}
              </Text>
            </Box>

            {/* Minimum */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <Flex align="center" gap={3} mb={3}>
                <Box p={2} borderRadius="lg" bg="green.subtle">
                  <Icon as={LuTrendingDown} boxSize={5} color="green.600" />
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Минимум
                </Text>
              </Flex>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {formatTime(data.minResolutionSeconds)}
              </Text>
            </Box>

            {/* Maximum */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <Flex align="center" gap={3} mb={3}>
                <Box p={2} borderRadius="lg" bg="red.subtle">
                  <Icon as={LuTrendingUp} boxSize={5} color="red.600" />
                </Box>
                <Text fontSize="sm" color="fg.muted">
                  Максимум
                </Text>
              </Flex>
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                {formatTime(data.maxResolutionSeconds)}
              </Text>
            </Box>
          </SimpleGrid>

          {/* Refresh button */}
          <Flex justify="center">
            <Button variant="outline" onClick={loadData} loading={isLoading}>
              Обновить данные
            </Button>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}
