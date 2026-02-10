import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { LuUsers } from "react-icons/lu";
import type { LineTicketStats } from "@/lib/api/stats";
import type { TicketStatus } from "@/types/ticket";

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
  bgColor?: string;
  darkBgColor?: string;
  fontSize?: string;
  onClick?: () => void;
}

export function StatBox({
  label,
  value,
  color,
  bgColor = "bg.subtle",
  darkBgColor,
  fontSize = "2xl",
  onClick,
}: StatBoxProps) {
  return (
    <Box
      textAlign="center"
      p={bgColor === "bg.subtle" ? 3 : 4}
      bg={bgColor}
      borderRadius="lg"
      _dark={darkBgColor ? { bg: darkBgColor } : undefined}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={onClick ? { bg: "bg.muted", transform: "scale(1.02)" } : {}}
      transition="all 0.15s"
    >
      <Text fontSize={fontSize} fontWeight="bold" color={color}>
        {value}
      </Text>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
    </Box>
  );
}

export function LineStatsCard({
  line,
  onStatClick,
}: {
  line: LineTicketStats;
  onStatClick: (title: string, statusKey: TicketStatus, lineId: number) => void;
}) {
  const stats = [
    {
      label: "Новых",
      value: line.newTickets,
      color: "blue.500",
      statusKey: "NEW" as TicketStatus,
    },
    {
      label: "В работе",
      value: line.open,
      color: "orange.500",
      statusKey: "OPEN" as TicketStatus,
    },
    {
      label: "Закрыто",
      value: line.closed,
      color: "gray.500",
      statusKey: "CLOSED" as TicketStatus,
    },
    {
      label: "Без назначения",
      value: line.unassigned,
      color: "yellow.500",
      statusKey: "NEW" as TicketStatus,
    },
  ];

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={5}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <HStack gap={2}>
          <Icon as={LuUsers} color="blue.500" />
          <Heading size="md">{line.lineName}</Heading>
        </HStack>
        <Text color="fg.muted" fontSize="sm">
          Всего: {line.total}
        </Text>
      </Flex>

      <Grid
        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={3}
      >
        {stats.map((stat) => (
          <StatBox
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            onClick={
              stat.value > 0
                ? () =>
                    onStatClick(
                      `${line.lineName} — ${stat.label}`,
                      stat.statusKey,
                      line.lineId,
                    )
                : undefined
            }
          />
        ))}
      </Grid>
    </Box>
  );
}
