"use client";

import { use, useCallback } from "react";
import {
  Box,
  Collapsible,
  Flex,
  Heading,
  Text,
  Spinner,
  Grid,
  GridItem,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
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
  const [descOpen, setDescOpen] = useState(false);
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
        hasPendingAssignment={currentAssignment?.status === "PENDING" && !!currentAssignment?.toUsername}
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

          <Collapsible.Root open={descOpen} onOpenChange={(e) => setDescOpen(e.open)}>
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
                  {descOpen ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
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
          <TicketSidebar ticket={ticket} isSpecialist={isSpecialist} />
        </GridItem>
      </Grid>
    </Box>
  );
}
