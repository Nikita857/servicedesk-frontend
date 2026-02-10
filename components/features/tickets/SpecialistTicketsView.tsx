"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import {
  LuCircleCheck,
  LuInbox,
  LuLoader,
  LuUserCheck,
} from "react-icons/lu";
import { useAuth, useSpecialistTicketsByStatus } from "@/lib/hooks";
import { TicketCompactCard } from "./TicketCompactCard";
import { AssignmentCompactCard } from "./AssignmentCompactCard";
import { AssignmentDecisionDialog } from "./AssignmentDecisionDialog";
import { assignmentApi, type Assignment } from "@/lib/api/assignments";
import { queryKeys } from "@/lib/queryKeys";
import type { TicketListItem } from "@/types/ticket";
import { SDPagination } from "@/components/ui/SDPagination";
import { Page } from "@/types";

export function SpecialistTicketsView() {
  const { NEW, OPEN, CLOSED } = useSpecialistTicketsByStatus(5);
  const { user } = useAuth();

  // Pending assignments query
  const [assignmentsPage, setAssignmentsPage] = useState(0);
  const assignmentsQuery = useQuery({
    queryKey: queryKeys.assignments.pending(assignmentsPage),
    queryFn: () => assignmentApi.getMyPending(assignmentsPage, 5),
    staleTime: 30 * 1000,
  });

  const assignmentsPageInfo: Page | undefined = assignmentsQuery.data
    ? {
        size: assignmentsQuery.data.size,
        number: assignmentsQuery.data.number,
        totalElements: assignmentsQuery.data.totalElements,
        totalPages: assignmentsQuery.data.totalPages,
      }
    : undefined;

  // Dialog state
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  return (
    <>
      <Box>
        <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="fg.default" mb={1}>
              Все тикеты линии
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Просмотр тикетов своей линии поддержки
            </Text>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} columnGap={3} rowGap={3}>
          {/* NEW TICKETS */}
          <TicketTile
            title="Новые тикеты"
            icon={LuInbox}
            colorPalette="blue"
            tickets={NEW.data?.content || []}
            isLoading={NEW.meta.isLoading}
            page={NEW.data?.page}
            onPageChange={NEW.actions.setPage}
            currentUser={user?.username}
          />

          {/* OPEN TICKETS */}
          <TicketTile
            title="В работе"
            icon={LuLoader}
            colorPalette="green"
            tickets={OPEN.data?.content || []}
            isLoading={OPEN.meta.isLoading}
            page={OPEN.data?.page}
            onPageChange={OPEN.actions.setPage}
            currentUser={user?.username}
          />

          {/* ASSIGNMENTS (pending for me) */}
          <AssignmentsTile
            assignments={assignmentsQuery.data?.content || []}
            isLoading={assignmentsQuery.isLoading}
            page={assignmentsPageInfo}
            onPageChange={setAssignmentsPage}
            onAssignmentClick={setSelectedAssignment}
          />

          {/* CLOSED TICKETS */}
          <TicketTile
            title="Завершённые"
            icon={LuCircleCheck}
            colorPalette="gray"
            tickets={CLOSED.data?.content || []}
            isLoading={CLOSED.meta.isLoading}
            page={CLOSED.data?.page}
            onPageChange={CLOSED.actions.setPage}
            currentUser={user?.username}
          />
        </SimpleGrid>
      </Box>

      <AssignmentDecisionDialog
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
      />
    </>
  );
}

// Tile component for ticket status categories
interface TicketTileProps {
  title: string;
  icon: React.ElementType;
  colorPalette: string;
  tickets: TicketListItem[];
  isLoading: boolean;
  page: Page | undefined;
  onPageChange: (page: number) => void;
  currentUser: string | undefined;
}

function TicketTile({
  title,
  icon,
  colorPalette,
  tickets,
  isLoading,
  page,
  onPageChange,
  currentUser,
}: TicketTileProps) {
  return (
    <Box
      bg="bg.surface"
      border="1px solid"
      borderColor="border.default"
      borderRadius="xl"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      minH="280px"
    >
      <Box
        bg={`${colorPalette}.50`}
        borderBottomWidth="1px"
        borderBottomColor={`${colorPalette}.200`}
        px={4}
        py={3}
        _dark={{
          bg: `${colorPalette}.900/20`,
          borderBottomColor: `${colorPalette}.800`,
        }}
      >
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Icon as={icon} boxSize={4} color={`${colorPalette}.600`} />
            <Heading size="sm" color="fg.default">
              {title}
            </Heading>
            <Badge colorPalette={colorPalette} variant="subtle" size="sm">
              {page?.totalElements ?? 0}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      <Box flex={1} px={3} py={2}>
        {isLoading ? (
          <Flex justify="center" align="center" h="150px">
            <Spinner size="md" />
          </Flex>
        ) : tickets.length === 0 ? (
          <Flex justify="center" align="center" h="150px" direction="column" gap={2}>
            <Text color="fg.muted" fontSize="sm">
              Тикетов нет
            </Text>
          </Flex>
        ) : (
          <VStack gap={1.5} align="stretch">
            {tickets.map((ticket) => (
              <TicketCompactCard
                key={ticket.id}
                ticket={ticket}
                currentUserName={currentUser}
              />
            ))}
          </VStack>
        )}
      </Box>

      {page != null && page.totalPages > 1 && (
        <SDPagination page={page} action={onPageChange} size="xs" />
      )}
    </Box>
  );
}

// Tile component for pending assignments
interface AssignmentsTileProps {
  assignments: Assignment[];
  isLoading: boolean;
  page: Page | undefined;
  onPageChange: (page: number) => void;
  onAssignmentClick: (assignment: Assignment) => void;
}

function AssignmentsTile({
  assignments,
  isLoading,
  page,
  onPageChange,
  onAssignmentClick,
}: AssignmentsTileProps) {
  return (
    <Box
      bg="bg.surface"
      border="1px solid"
      borderColor="border.default"
      borderRadius="xl"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      minH="280px"
    >
      <Box
        bg="orange.50"
        borderBottomWidth="1px"
        borderBottomColor="orange.200"
        px={4}
        py={3}
        _dark={{
          bg: "orange.900/20",
          borderBottomColor: "orange.800",
        }}
      >
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Icon as={LuUserCheck} boxSize={4} color="orange.600" />
            <Heading size="sm" color="fg.default">
              Назначения на меня
            </Heading>
            <Badge colorPalette="orange" variant="subtle" size="sm">
              {page?.totalElements ?? 0}
            </Badge>
          </HStack>
        </Flex>
      </Box>

      <Box flex={1} px={3} py={2}>
        {isLoading ? (
          <Flex justify="center" align="center" h="150px">
            <Spinner size="md" />
          </Flex>
        ) : assignments.length === 0 ? (
          <Flex justify="center" align="center" h="150px" direction="column" gap={2}>
            <Text color="fg.muted" fontSize="sm">
              Назначений нет
            </Text>
          </Flex>
        ) : (
          <VStack gap={1.5} align="stretch">
            {assignments.map((assignment) => (
              <AssignmentCompactCard
                key={assignment.id}
                assignment={assignment}
                onClick={onAssignmentClick}
              />
            ))}
          </VStack>
        )}
      </Box>

      {page != null && page.totalPages > 1 && (
        <SDPagination page={page} action={onPageChange} size="xs" />
      )}
    </Box>
  );
}