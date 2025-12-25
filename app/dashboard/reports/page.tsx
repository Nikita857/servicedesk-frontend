"use client";

import { Box, Heading, Text, SimpleGrid, VStack, Icon } from "@chakra-ui/react";
import Link from "next/link";
import {
  LuUsers,
  LuLayers,
  LuHistory,
  LuArrowRightLeft,
  LuClock,
  LuTag,
  LuTags,
  LuPercent,
  LuList,
  LuActivity,
} from "react-icons/lu";
import type { IconType } from "react-icons";

interface ReportCard {
  title: string;
  description: string;
  href: string;
  icon: IconType;
  color: string;
}

const reports: ReportCard[] = [
  {
    title: "Время по специалистам",
    description: "Затраченное время на тикеты по каждому специалисту за период",
    href: "/dashboard/reports/time-by-specialist",
    icon: LuUsers,
    color: "blue",
  },
  {
    title: "Время по линиям",
    description: "Затраченное время на тикеты по линиям поддержки за период",
    href: "/dashboard/reports/time-by-line",
    icon: LuLayers,
    color: "purple",
  },
  {
    title: "История тикета",
    description: "Полная история статусов и временная статистика по тикету",
    href: "/dashboard/reports/ticket-history",
    icon: LuHistory,
    color: "orange",
  },
  {
    title: "История переназначений",
    description: "История переадресации тикета между специалистами и линиями",
    href: "/dashboard/reports/ticket-assignments",
    icon: LuArrowRightLeft,
    color: "teal",
  },
  {
    title: "Время решения",
    description: "Среднее, минимальное и максимальное время решения тикетов",
    href: "/dashboard/reports/resolution-time",
    icon: LuClock,
    color: "green",
  },
  {
    title: "По категориям пользователя",
    description: "Статистика тикетов по категориям, выбранным пользователями",
    href: "/dashboard/reports/by-user-category",
    icon: LuTag,
    color: "cyan",
  },
  {
    title: "По категориям поддержки",
    description: "Статистика тикетов по категориям, назначенным поддержкой",
    href: "/dashboard/reports/by-support-category",
    icon: LuTags,
    color: "pink",
  },
  {
    title: "По статусам",
    description: "Распределение тикетов по статусам с процентами",
    href: "/dashboard/reports/by-status",
    icon: LuPercent,
    color: "yellow",
  },
  {
    title: "Все тикеты",
    description: "Полный список тикетов, включая удалённые",
    href: "/dashboard/reports/all-tickets",
    icon: LuList,
    color: "gray",
  },
  {
    title: "Загрузка специалистов",
    description: "Текущая загрузка: активные тикеты, решённые сегодня, время",
    href: "/dashboard/reports/specialist-workload",
    icon: LuActivity,
    color: "red",
  },
];

export default function ReportsPage() {
  return (
    <Box>
      {/* Header */}
      <Box mb={8}>
        <Heading size="xl" color="fg.default" mb={2}>
          Отчёты
        </Heading>
        <Text color="fg.muted">
          Аналитика и статистика работы службы поддержки
        </Text>
      </Box>

      {/* Report Cards Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={5}>
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                borderColor: `${report.color}.500`,
                shadow: "md",
                transform: "translateY(-2px)",
              }}
              h="full"
            >
              <VStack align="start" gap={3}>
                <Box p={3} borderRadius="lg" bg={`${report.color}.subtle`}>
                  <Icon
                    as={report.icon}
                    boxSize={6}
                    color={`${report.color}.600`}
                  />
                </Box>
                <Box>
                  <Text fontWeight="semibold" fontSize="lg" color="fg.default">
                    {report.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {report.description}
                  </Text>
                </Box>
              </VStack>
            </Box>
          </Link>
        ))}
      </SimpleGrid>
    </Box>
  );
}
