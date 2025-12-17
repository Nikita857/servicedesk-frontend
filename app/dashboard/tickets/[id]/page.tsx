"use client";

import { use, useCallback, useEffect } from "react";
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
import { TicketChat } from "@/components/features/tickets";
import TicketHeader from "@/components/features/tickets/TicketHeader";
import EscalationPanel from "@/components/features/tickets/EscalationPanel";
import TicketSidebar from "@/components/features/tickets/TicketSidebar";
import {
  useTicketDetail,
  useEscalation,
  useSupportLines,
  useTicketWebSocket,
} from "@/lib/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const canEscalate = isSpecialist;

  // ==================== Hooks ====================
  const {
    ticket,
    isLoading,
    currentAssignment,
    assignmentHistory,
    showHistory,
    setShowHistory,
    updateTicket,
    refresh,
  } = useTicketDetail(Number(id));

  const {
    supportLines,
    specialists,
    isLoadingSpecialists,
    isOnLastLine,
    loadSpecialists,
    clearSpecialists,
  } = useSupportLines({ ticket });

  const handleEscalationSuccess = useCallback(
    async (
      updatedTicket: typeof ticket,
      newAssignment: typeof currentAssignment
    ) => {
      if (updatedTicket) {
        updateTicket(updatedTicket);
      }
      await refresh();
    },
    [updateTicket, refresh]
  );

  const escalation = useEscalation({
    ticket,
    onSuccess: handleEscalationSuccess,
  });

  // Load specialists when line changes
  useEffect(() => {
    if (escalation.selectedLineId) {
      loadSpecialists(escalation.selectedLineId);
    } else {
      clearSpecialists();
    }
  }, [escalation.selectedLineId, loadSpecialists, clearSpecialists]);

  // WebSocket for real-time updates
  useTicketWebSocket({
    ticketId: Number(id),
    currentTicket: ticket,
    onTicketUpdate: updateTicket,
    onTicketDeleted: () => router.push("/dashboard/tickets"),
    enabled: !!ticket,
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
      />

      {/* Escalation Panel */}
      {escalation.showEscalation && (
        <EscalationPanel
          supportLines={supportLines}
          specialists={specialists}
          selectedLineId={escalation.selectedLineId}
          setSelectedLineId={escalation.setSelectedLineId}
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
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <TicketSidebar
            ticket={ticket}
            currentAssignment={currentAssignment}
            isSpecialist={isSpecialist}
            assignmentHistory={assignmentHistory}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
          />
        </GridItem>
      </Grid>
    </Box>
  );
}
