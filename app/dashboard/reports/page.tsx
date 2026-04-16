"use client";

import { Box, Heading, Text, SimpleGrid, VStack, Icon } from "@chakra-ui/react";
import Link from "next/link";
import {
  LuHistory,
  LuArrowRightLeft,
  LuTag,
  LuTags,
  LuPercent,
  LuList,
  LuChartNoAxesCombined,
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
    title: "История заявки",
    description: "Полная история статусов и временная статистика по заявке",
    href: "/dashboard/reports/ticket-history",
    icon: LuHistory,
    color: "orange",
  },
  {
    title: "История переназначений",
    description: "История переадресации заявки между специалистами и линиями",
    href: "/dashboard/reports/ticket-assignments",
    icon: LuArrowRightLeft,
    color: "teal",
  },
  {
    title: "По категориям пользователя",
    description: "Статистика заявок по категориям, выбранным пользователями",
    href: "/dashboard/reports/by-user-category",
    icon: LuTag,
    color: "cyan",
  },
  {
    title: "По категориям поддержки",
    description: "Статистика заявок по категориям, назначенным поддержкой",
    href: "/dashboard/reports/by-support-category",
    icon: LuTags,
    color: "pink",
  },
  {
    title: "По статусам",
    description: "Распределение заявок по статусам с процентами",
    href: "/dashboard/reports/by-status",
    icon: LuPercent,
    color: "yellow",
  },
  {
    title: "Все заявки",
    description: "Полный список заявок, включая удалённые",
    href: "/dashboard/reports/all-tickets",
    icon: LuList,
    color: "gray",
  },
  {
    title: "Графики Kibana",
    description:
      "Визуальное представление статистики по специалистам, заявкам, статьям",
    href: "http://192.168.0.111:5601/app/dashboards#/view/4d0f9f93-4b8b-49b9-aebd-3e2ed43988c5?_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-90d%2Fd,to:now))",
    icon: LuChartNoAxesCombined,
    color: "green",
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
