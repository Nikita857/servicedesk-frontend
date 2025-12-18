"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Icon,
  VStack,
  Spinner,
  Button,
} from "@chakra-ui/react";
import {
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
  LuArrowRight,
  LuBellRing,
} from "react-icons/lu";
import Link from "next/link";
import type { IconType } from "react-icons";
import { ticketApi } from "@/lib/api/tickets";
import { assignmentApi } from "@/lib/api/assignments";
import { useAuthStore } from "@/stores";
import type { TicketListItem } from "@/types/ticket";
import { TicketCard } from "@/components/features/tickets";
import { useTicketsWebSocket } from "@/lib/hooks";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  color: string;
  href?: string;
  highlight?: boolean;
}

function StatCard({
  label,
  value,
  icon,
  color,
  href,
  highlight,
}: StatCardProps) {
  const content = (
    <Box
      bg={highlight ? "yellow.50" : "bg.surface"}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={highlight ? "yellow.300" : "border.default"}
      p={5}
      _dark={
        highlight
          ? { bg: "yellow.900/20", borderColor: "yellow.700" }
          : undefined
      }
      _hover={
        href
          ? {
              borderColor: "gray.400",
              transform: "translateY(-2px)",
              transition: "all 0.2s",
            }
          : undefined
      }
      cursor={href ? "pointer" : "default"}
    >
      <Flex align="flex-start" justify="space-between">
        <VStack align="flex-start" gap={1}>
          <Text color="fg.muted" fontSize="sm">
            {label}
          </Text>
          <Heading size="2xl" color={highlight ? "yellow.600" : "fg.default"}>
            {value}
          </Heading>
        </VStack>
        <Box
          p={3}
          borderRadius="lg"
          bg={highlight ? "yellow.100" : "bg.subtle"}
          _dark={highlight ? { bg: "yellow.800/30" } : undefined}
        >
          <Icon as={icon} boxSize={6} color={color} />
        </Box>
      </Flex>
    </Box>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [recentTickets, setRecentTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    open: 0,
    resolved: 0,
    overdue: 0,
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent tickets - load more to have unassigned available
        const ticketsResponse = await ticketApi.list(0, 20);

        // Filter to only unassigned tickets for dashboard display
        const unassignedTickets = ticketsResponse.content.filter(
          (t) =>
            !t.assignedToUsername &&
            (t.status === "NEW" || t.status === "PENDING")
        );
        setRecentTickets(unassignedTickets.slice(0, 5)); // Show max 5

        setStats({
          open: ticketsResponse.content.filter((t) =>
            ["NEW", "OPEN", "PENDING"].includes(t.status)
          ).length,
          resolved: ticketsResponse.content.filter(
            (t) => t.status === "RESOLVED"
          ).length,
          overdue: ticketsResponse.content.filter(
            (t) => t.slaDeadline && new Date(t.slaDeadline) < new Date()
          ).length,
        });

        // Fetch pending assignments count for specialists
        if (isSpecialist) {
          const count = await assignmentApi.getPendingCount();
          setPendingCount(count);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isSpecialist]);

  // Handle new ticket from WebSocket
  const handleNewTicket = useCallback((ticket: TicketListItem) => {
    // Add to list if unassigned
    if (!ticket.assignedToUsername && ticket.status === "NEW") {
      setRecentTickets((prev) => [ticket, ...prev].slice(0, 5));
    }
    // Update stats
    setStats((prev) => ({
      ...prev,
      open: prev.open + 1,
    }));
  }, []);

  // WebSocket for real-time new tickets
  useTicketsWebSocket({
    onNewTicket: handleNewTicket,
    enabled: true,
  });

  const statCards: StatCardProps[] = [
    {
      label: "В работе",
      value: stats.open,
      icon: LuClock,
      color: "orange.500",
    },
    {
      label: "Решено",
      value: stats.resolved,
      icon: LuCircleCheck,
      color: "green.500",
    },
    {
      label: "Просрочено",
      value: stats.overdue,
      icon: LuCircleAlert,
      color: "red.500",
    },
  ];

  // Add pending card for specialists
  if (isSpecialist) {
    statCards.push({
      label: "Ожидают принятия",
      value: pendingCount,
      icon: LuBellRing,
      color: "yellow.500",
      href: "/dashboard/tickets?filter=pending",
      highlight: pendingCount > 0,
    });
  }

  return (
    <Box>
      {/* Page Header */}
      <Flex mb={6} justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Дашборд
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Обзор системы поддержки
          </Text>
        </Box>
      </Flex>

      {/* Stats Grid */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: isSpecialist ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
        }}
        gap={5}
        mb={8}
      >
        {statCards.map((stat) => (
          <GridItem key={stat.label}>
            <StatCard {...stat} />
          </GridItem>
        ))}
      </Grid>

      {/* Секция последние тикеты */}
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="fg.default">
            Невзятые тикеты
          </Heading>
          <Link href="/dashboard/tickets?filter=unprocessed">
            <Button variant="ghost" size="sm" color="fg.muted">
              Все невзятые
              <LuArrowRight />
            </Button>
          </Link>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner />
          </Flex>
        ) : recentTickets.length === 0 ? (
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={8}
            textAlign="center"
          >
            <Text color="fg.muted">Нет невзятых тикетов</Text>
          </Box>
        ) : (
          <VStack gap={3} align="stretch">
            {recentTickets
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
