"use client";

import { useState, useEffect, use } from "react";
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
import { ticketApi } from "@/lib/api/tickets";
import {
  supportLineApi,
  Specialist,
  SupportLine,
} from "@/lib/api/supportLines";
import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/stores";
import { TicketChat } from "@/components/features/tickets";
import type { Ticket } from "@/types/ticket";
import TicketHeader from "@/components/features/tickets/TicketHeader";
import EscalationPanel from "@/components/features/tickets/EscalationPanel";
import TicketSidebar from "@/components/features/tickets/TicketSidebar";
import axios, { AxiosError } from "axios";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  // Check if user can escalate (all specialists can escalate)
  const canEscalate = isSpecialist;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escalation state
  const [showEscalation, setShowEscalation] = useState(false);
  const [supportLines, setSupportLines] = useState<SupportLine[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>();
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<
    number | undefined
  >();
  const [escalationComment, setEscalationComment] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(false);
  const [isOnLastLine, setIsOnLastLine] = useState(false);

  // Assignment history
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(
    null
  );
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load ticket and assignment info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ticketData = await ticketApi.get(Number(id));
        setTicket(ticketData);

        // Load current assignment
        const current = await assignmentApi.getCurrentForTicket(Number(id));
        setCurrentAssignment(current);

        // Load assignment history
        const history = await assignmentApi.getTicketHistory(Number(id));
        setAssignmentHistory(history);
      } catch (error) {
        toaster.error({
          title: "Ошибка",
          description: "Не удалось загрузить тикет",
        });
        router.push("/dashboard/tickets");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  // Load support lines and determine if on last line (DEVELOPER line)
  useEffect(() => {
    const loadSupportLines = async () => {
      try {
        const lines = await supportLineApi.getAll();
        setSupportLines(lines);

        // Determine if ticket is on the DEVELOPER line (last/3rd line)
        // Check by line name containing DEVELOPER-related keywords or by max displayOrder
        if (ticket?.supportLine && lines.length > 0) {
          const ticketLineName = ticket.supportLine.name?.toLowerCase() || "";

          // Check if current line is DEVELOPER line by name
          const isDeveloperLine =
            ticketLineName.includes("developer") ||
            ticketLineName.includes("разработ") ||
            ticketLineName.includes("3 линия") ||
            ticketLineName.includes("третья");

          // Fallback: check by displayOrder if name check doesn't match
          if (!isDeveloperLine) {
            const maxDisplayOrder = Math.max(
              ...lines.map((l) => l.displayOrder || 0)
            );
            const ticketLineOrder = ticket.supportLine.displayOrder || 0;
            // Only consider as last line if displayOrder is actually set and is the max
            setIsOnLastLine(
              ticketLineOrder > 0 && ticketLineOrder >= maxDisplayOrder
            );
          } else {
            setIsOnLastLine(true);
          }
        }
      } catch (error) {
        console.error("Failed to load support lines", error);
      }
    };

    if (ticket) {
      loadSupportLines();
    }
  }, [ticket]);

  // Load specialists when line is selected
  useEffect(() => {
    if (selectedLineId) {
      setIsLoadingSpecialists(true);
      setSpecialists([]);
      setSelectedSpecialistId(undefined);

      supportLineApi
        .getSpecialists(selectedLineId)
        .then(setSpecialists)
        .catch(console.error)
        .finally(() => setIsLoadingSpecialists(false));
    } else {
      setSpecialists([]);
      setSelectedSpecialistId(undefined);
    }
  }, [selectedLineId]);

  const handleEscalate = async () => {
    if (!ticket || !selectedLineId || !escalationComment.trim()) {
      toaster.error({
        title: "Ошибка",
        description: "Выберите линию поддержки и укажите комментарий",
        closable: true,
      });
      return;
    }

    setIsEscalating(true);
    try {
      // Use the new assignments API
      const assignment = await assignmentApi.create({
        ticketId: ticket.id,
        toLineId: selectedLineId,
        toUserId: selectedSpecialistId,
        fromLineId: ticket.supportLine?.id,
        fromUserId: user?.id,
        note: escalationComment,
        mode: selectedSpecialistId ? "DIRECT" : "FIRST_AVAILABLE",
      });

      toaster.success({
        title: "Тикет переадресован",
        description: selectedSpecialistId
          ? "Тикет назначен на специалиста"
          : "Тикет передан на линию поддержки",
      });

      // Refresh ticket and assignment data
      const updatedTicket = await ticketApi.get(ticket.id);
      setTicket(updatedTicket);
      setCurrentAssignment(assignment);
      setAssignmentHistory((prev) => [assignment, ...prev]);

      // Reset form
      setShowEscalation(false);
      setSelectedLineId(undefined);
      setSelectedSpecialistId(undefined);
      setEscalationComment("");
    } catch (error) {
      //CHECKME это моя реализация обработки ошибок с помощью тостов. Возможно будет правильно создать файл с разными тостами error, success, warning и т.п 
      // И использовать их во всем проекте. Да и на будущее, делай все тосты closable: true
      if (axios.isAxiosError(error) && error.response) {
        toaster.error({
          title: "Ошибка",
          description: `Не удалось переадресовать тикет. ${error.response.data.message}`,
          closable: true,
        });
      } else {
        console.error(error);
        toaster.error({
          title: "Ошибка",
          description: "Неизвестная ошибка",
          closable: true,
        });
      }
    } finally {
      setIsEscalating(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!ticket) return null;

  return (
    // TODO Проверить качество рефакторинга, выявить недостатки и исправить
    <Box>
      {/* Ticket Header */}
      <TicketHeader
        ticket={ticket}
        setTicket={setTicket}
        isSpecialist={isSpecialist}
        canEscalate={canEscalate}
        showEscalation={showEscalation}
        setShowEscalation={setShowEscalation}
        isOnLastLine={isOnLastLine}
      />

      {/* Escalation Panel */}
      {showEscalation && (
        <EscalationPanel
          supportLines={supportLines}
          specialists={specialists}
          selectedLineId={selectedLineId}
          setSelectedLineId={setSelectedLineId}
          selectedSpecialistId={selectedSpecialistId}
          setSelectedSpecialistId={setSelectedSpecialistId}
          isLoadingSpecialists={isLoadingSpecialists}
          setIsLoadingSpecialists={setIsLoadingSpecialists}
          escalationComment={escalationComment}
          setEscalationComment={setEscalationComment}
          isEscalating={isEscalating}
          setShowEscalation={setShowEscalation}
          handleEscalate={handleEscalate}
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
            <TicketChat ticketId={ticket.id} />
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
