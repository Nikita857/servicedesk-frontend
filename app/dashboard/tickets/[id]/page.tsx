"use client";

import { use, useCallback, useState } from "react";
import {
  Box,
  Button,
  Collapsible,
  Flex,
  Grid,
  GridItem,
  HStack,
  Spinner,
  Status,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import TicketHeader from "@/components/features/tickets/TicketHeader";
import EscalationPanel from "@/components/features/tickets/EscalationPanel";
import TicketSidebar from "@/components/features/tickets/TicketSidebar";
import {
  useEscalation,
  useSupportLinesQuery,
  useTicketQuery,
  useTicketWebSocket,
} from "@/lib/hooks";
import { useCoExecutors } from "@/lib/hooks/ticket-detail/useCoExecutors";
import {
  ClosureConfirmationDialog,
  TicketChat,
} from "@/components/features/tickets";
import AssignmentPanel from "@/components/features/tickets/AssignmentPanel";
import { Tooltip } from "@/components/ui";
import { ticketPriorityConfig, ticketStatusConfig } from "@/types";
import DeadlineBanner from "@/components/ui/ticket/DeadlineBanner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const ticketId = Number(id);
  const [descOpen, setDescOpen] = useState(true);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const canEscalate = isSpecialist;
  const isAdmin = user?.roles?.includes("ADMIN") || false;

  // ==================== React Query Hooks ====================
  const {
    ticket,
    isLoading,
    currentAssignment,
    assignmentHistory,
    updateTicket,
    refetch,
  } = useTicketQuery(ticketId);

  const {
    supportLines,
    specialists,
    isLoadingSpecialists,
    isOnLastLine,
    selectedLineId,
    setSelectedLineId,
  } = useSupportLinesQuery({ ticket });

  const handleEscalationSuccess = useCallback(async () => {
    refetch();
  }, [refetch]);

  const escalation = useEscalation({
    ticket,
    onSuccess: handleEscalationSuccess,
  });

  // Sync selectedLineId between hooks
  const handleLineChange = useCallback(
    (lineId: number | undefined) => {
      setSelectedLineId(lineId);
      escalation.setSelectedLineId(lineId);
    },
    [setSelectedLineId, escalation],
  );

  const { coExecutors } = useCoExecutors(ticketId);

  // Может ли текущий пользователь менять статус тикета
  const canManageStatus =
    isAdmin ||
    user?.id === ticket?.assignedTo?.id ||
    user?.id === ticket?.createdBy?.id ||
    coExecutors.some((ce) => ce.userId === user?.id);

  // WebSocket for real-time updates
  useTicketWebSocket({
    ticketId,
    currentTicket: ticket,
    onTicketUpdate: updateTicket,
    onTicketDeleted: () => router.push("/dashboard/tickets"),
    user: user,
    enabled: !!ticket,
    showToasts: true,
  });

  // ==================== Loading State ====================
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!ticket) return null;

  const statusConf = ticketStatusConfig[ticket.status] || {
    label: ticket.status,
    color: "gray",
  };
  const priorityConf = ticketPriorityConfig[ticket.priority] || {
    label: ticket.priority,
    color: "gray",
  };

  // ==================== UI ====================
  return (
    <Box>
      {/* Ticket Header */}
      <TicketHeader
        ticket={ticket}
        setTicket={updateTicket}
        isSpecialist={isSpecialist}
        canEscalate={canEscalate}
        canManageStatus={canManageStatus}
        showEscalation={escalation.showEscalation}
        setShowEscalation={escalation.setShowEscalation}
        isOnLastLine={isOnLastLine}
        hasPendingAssignment={
          currentAssignment?.status === "PENDING" &&
          !!currentAssignment?.toUsername
        }
        currentAssignment={currentAssignment ?? null}
        onAssignmentDecision={refetch}
        user={user}
      />

      {/* Escalation Panel */}
      {escalation.showEscalation && (
        <EscalationPanel
          supportLines={supportLines}
          specialists={specialists}
          selectedLineId={selectedLineId}
          setSelectedLineId={handleLineChange}
          selectedSpecialistId={escalation.selectedSpecialistId}
          setSelectedSpecialistId={escalation.setSelectedSpecialistId}
          isLoadingSpecialists={isLoadingSpecialists}
          setIsLoadingSpecialists={() => {}}
          escalationComment={escalation.escalationComment}
          setEscalationComment={escalation.setEscalationComment}
          isEscalating={escalation.isEscalating}
          setShowEscalation={escalation.setShowEscalation}
          handleEscalate={escalation.handleEscalate}
        />
      )}

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4}>
        {/* Main content */}
        <GridItem>
          {/* Диалог подтверждения закрытия для автора тикета */}
          <ClosureConfirmationDialog
            ticket={ticket}
            onTicketUpdate={updateTicket}
          />

          <Collapsible.Root
            open={descOpen}
            onOpenChange={(e) => setDescOpen(e.open)}
          >
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              overflow="hidden"
            >
              <Collapsible.Trigger asChild>
                <Button
                  variant="ghost"
                  w="full"
                  justifyContent="space-between"
                  px={4}
                  py={3}
                  h="auto"
                  borderRadius="none"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  Описание
                  <Wrap gap={2}>
                    <HStack>
                      <Tooltip content="Статус заявки">
                        <Status.Root>
                          <Status.Indicator colorPalette={statusConf.color} />{" "}
                          <Text fontWeight="medium" fontSize="sm">
                            {statusConf.label}
                          </Text>
                        </Status.Root>
                      </Tooltip>
                      <Tooltip content="Приоритет">
                        <Status.Root>
                          <Status.Indicator colorPalette={priorityConf.color} />{" "}
                          <Text fontWeight="medium" fontSize="sm">
                            {priorityConf.label}
                          </Text>
                        </Status.Root>
                      </Tooltip>
                    </HStack>
                    {descOpen ? (
                      <LuChevronUp size={14} />
                    ) : (
                      <LuChevronDown size={14} />
                    )}
                  </Wrap>
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Box px={4} pb={4}>
                  <Text color="fg.default" whiteSpace="pre-wrap" fontSize="sm">
                    {ticket.description}
                  </Text>
                  {ticket.link1c && (
                    <Box mt={3} p={2} bg="bg.subtle" borderRadius="md">
                      <Text fontSize="xs" color="fg.muted">
                        Ссылка 1С: {ticket.link1c}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Collapsible.Content>
            </Box>
          </Collapsible.Root>

          {/* Messages section */}
          <Box mt={3}>
            <TicketChat
              ticketId={ticket.id}
              ticketStatus={ticket.status}
              isCreator={user?.id === ticket.createdBy?.id}
            />
          </Box>

          {/* Assignment Panel - under chat */}
          <AssignmentPanel
            currentAssignment={currentAssignment}
            assignmentHistory={assignmentHistory}
            isSpecialist={isSpecialist}
            currentUsername={user?.username}
            onDecision={refetch}
          />
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <Box mb={2}>
            <TicketSidebar ticket={ticket} isSpecialist={isSpecialist} />
          </Box>
          <DeadlineBanner ticketId={ticketId} />
        </GridItem>
      </Grid>
    </Box>
  );
}
