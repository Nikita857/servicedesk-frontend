"use client";

import { use, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import TicketHeader from "@/components/features/tickets/TicketHeader";
import EscalationPanel from "@/components/features/tickets/EscalationPanel";
import TicketSidebar from "@/components/features/tickets/TicketSidebar";
import {
  useTicketQuery,
  useSupportLinesQuery,
  useEscalation,
  useTicketWebSocket,
} from "@/lib/hooks";
import {
  ClosureConfirmationDialog,
  TicketChat,
} from "@/components/features/tickets";
import AssignmentPanel from "@/components/features/tickets/AssignmentPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const ticketId = Number(id);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const canEscalate = isSpecialist;

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
    [setSelectedLineId, escalation]
  );

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

  // ==================== UI ====================
  return (
    <Box>
      {/* Ticket Header */}
      <TicketHeader
        ticket={ticket}
        setTicket={updateTicket}
        isSpecialist={isSpecialist}
        canEscalate={canEscalate}
        showEscalation={escalation.showEscalation}
        setShowEscalation={escalation.setShowEscalation}
        isOnLastLine={isOnLastLine}
        hasPendingAssignment={currentAssignment?.status === "PENDING"}
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

      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
        {/* Main content */}
        <GridItem>
          {/* Диалог подтверждения закрытия для автора тикета */}
          <ClosureConfirmationDialog
            ticket={ticket}
            onTicketUpdate={updateTicket}
          />

          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <Heading size="md" mb={4} color="fg.default">
              Описание
            </Heading>
            <Text color="fg.default" whiteSpace="pre-wrap">
              {ticket.description}
            </Text>

            {ticket.link1c && (
              <Box mt={4} p={3} bg="bg.subtle" borderRadius="lg">
                <Text fontSize="sm" color="fg.muted">
                  Ссылка 1С: {ticket.link1c}
                </Text>
              </Box>
            )}
          </Box>

          {/* Messages section */}
          <Box mt={6}>
            <TicketChat ticketId={ticket.id} ticketStatus={ticket.status} />
          </Box>

          {/* Assignment Panel - under chat */}
          <AssignmentPanel
            currentAssignment={currentAssignment}
            assignmentHistory={assignmentHistory}
            isSpecialist={isSpecialist}
          />
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <TicketSidebar ticket={ticket} isSpecialist={isSpecialist} />
        </GridItem>
      </Grid>
    </Box>
  );
}
