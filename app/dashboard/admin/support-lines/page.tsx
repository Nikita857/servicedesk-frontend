"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { LuClock, LuUsers, LuChevronRight } from "react-icons/lu";
import Link from "next/link";
import { useSupportLines } from "@/lib/hooks/admin-support-lines";
import { type SupportLine } from "@/lib/api/supportLines";

export default function SupportLinesPage() {
  const { lines, isLoading } = useSupportLines();

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Линии поддержки
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление линиями поддержки и специалистами
          </Text>
        </Box>
      </Flex>

      {/* Content */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : !lines || lines.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="200px"
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Text color="fg.muted">Нет линий поддержки</Text>
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {lines.map((line: SupportLine) => (
            <SupportLineCard key={line.id} line={line} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function SupportLineCard({ line }: { line: SupportLine }) {
  return (
    <Link href={`/dashboard/admin/support-lines/${line.id}`}>
      <Box
        bg="bg.surface"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        p={4}
        _hover={{ borderColor: "gray.300", shadow: "sm" }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <Flex justify="space-between" align="center" gap={3}>
          <Box flex={1}>
            <HStack gap={2} mb={2}>
              <Text fontWeight="medium" color="fg.default" fontSize="lg">
                {line.name}
              </Text>
              <Badge colorPalette="blue" variant="subtle">
                #{line.displayOrder}
              </Badge>
            </HStack>

            {line.description && (
              <Text fontSize="sm" color="fg.muted" mb={2}>
                {line.description}
              </Text>
            )}

            <HStack gap={4} fontSize="sm" color="fg.muted">
              <HStack gap={1}>
                <LuClock size={14} />
                <Text>SLA: {line.slaMinutes} мин</Text>
              </HStack>
              <HStack gap={1}>
                <LuUsers size={14} />
                <Text>Специалистов: {line.specialistCount}</Text>
              </HStack>
            </HStack>
          </Box>

          <LuChevronRight size={20} />
        </Flex>
      </Box>
    </Link>
  );
}
