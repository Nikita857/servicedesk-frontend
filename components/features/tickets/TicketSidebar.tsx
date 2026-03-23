import {Ticket} from "@/types";
import {formatDate, formatDuration} from "@/lib/utils";
import {Box, createListCollection, HStack, Text, VStack,} from "@chakra-ui/react";
import {LuCircleX, LuClock, LuMessageSquare, LuPaperclip, LuUser,} from "react-icons/lu";
import {DateTimePicker} from "@/components/features/layout/DateTimePicker";
import CoExecutorPanel from "./CoExecutorPanel";
import {useMemo} from "react";
import {useAuth, useCategoriesQuery} from "@/lib/hooks";
import {DataSelect} from "@/components/ui";
import {useTicketCategoryBySupportLine} from "@/lib/hooks/ticket-detail/useTicketCategoryBySupportLine";

interface TicketSidebarProps {
  ticket: Ticket;
  isSpecialist: boolean;
}

function calculateTimeSpent(ticket: Ticket): number {
  const createdAt = new Date(ticket.createdAt).getTime();
  const endTime = ticket.closedAt
      ? new Date(ticket.closedAt).getTime()
      : Date.now();
  return Math.floor((endTime - createdAt) / 1000);
}

function InfoRow({label, children}: { label: string; children: React.ReactNode }) {
  return (
      <Box>
        <Text fontSize="10px" color="fg.muted" textTransform="uppercase" fontWeight="semibold" mb={0.5}>
          {label}
        </Text>
        {children}
      </Box>
  );
}

export default function TicketSidebar({ticket, isSpecialist}: TicketSidebarProps) {
  const timeSpentSeconds = calculateTimeSpent(ticket);

  const {data: categories = []} = useCategoriesQuery();
  const {setTicketCategory} = useTicketCategoryBySupportLine(ticket.id)
  const {user} = useAuth();

  const categoryCollection = useMemo(
      () =>
          createListCollection({
            items: categories.map((cat) => ({
              label: cat.name,
              value: cat.id.toString(),
            })),
          }),
      [categories],
  );

  return (
      <VStack gap={3} align="stretch">
        {/* Rejection Alert */}
        {isSpecialist && ticket.lastAssignment?.status === "REJECTED" && (
            <Box
                bg="red.50"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="red.200"
                p={3}
                _dark={{bg: "red.900/20", borderColor: "red.700"}}
            >
              <HStack gap={2} mb={1}>
                <LuCircleX color="var(--chakra-colors-red-500)" size={14}/>
                <Text fontWeight="semibold" color="red.600" fontSize="sm" _dark={{color: "red.300"}}>
                  Переадресация отклонена
                </Text>
              </HStack>
              {ticket.lastAssignment.rejectedReason && (
                  <Text fontSize="xs" color="red.700" _dark={{color: "red.200"}}>
                    {ticket.lastAssignment.rejectedReason}
                  </Text>
              )}
              <Text fontSize="xs" color="red.500" mt={1}>
                {ticket.lastAssignment.toFio || ticket.lastAssignment.toUsername || "—"} ·{" "}
                {formatDate(ticket.lastAssignment.rejectedAt || "")}
              </Text>
            </Box>
        )}

        {/* Main Info */}
        <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={4}
        >
          <VStack gap={3} align="stretch">
            <InfoRow label="Автор">
              <HStack gap={1.5}>
                <LuUser size={13}/>
                <Text fontSize="sm" color="fg.default">
                  {ticket.createdBy?.fio || ticket.createdBy?.username || "—"}
                </Text>
              </HStack>
            </InfoRow>

            <InfoRow label="Исполнитель">
              <Text fontSize="sm" color="fg.default">
                {ticket.assignedTo
                    ? ticket.assignedTo.fio || ticket.assignedTo.username
                    : "—"}
              </Text>
            </InfoRow>

            <InfoRow label="Линия поддержки">
              <Text fontSize="sm" color="fg.default">{ticket.supportLine?.name || "—"}</Text>
            </InfoRow>

            <InfoRow label="Категория">
              <Text fontSize="sm" color="fg.default">{ticket.categoryUser?.name || "—"}</Text>
            </InfoRow>

            <InfoRow label="Категория по мнению поддержки">
              {isSpecialist ? (
                  <DataSelect
                      collection={categoryCollection}
                      placeholder="Выберите категорию"
                      value={ticket.categorySupport ? [ticket.categorySupport.id.toString()] : undefined}
                      onValueChange={(e) => {
                        setTicketCategory.mutate(Number(e.value[0]))
                      }}
                  />
              ) : (
                  <Text fontSize="sm" color="fg.default">{ticket.categorySupport?.name || "—"}</Text>
              )}
            </InfoRow>

            <InfoRow label="Ориентировочный срок выполнения">
              {ticket.estimatedCompletionDate && (
                  <Text fontSize="sm" color="fg.default" mb={isSpecialist ? 1 : 0}>
                    {formatDate(ticket.estimatedCompletionDate)}
                  </Text>
              )}
              {isSpecialist ? (
                  <DateTimePicker
                      ticketId={ticket.id}
                      currentDate={ticket.estimatedCompletionDate ?? null}
                  />
              ) : (
                  !ticket.estimatedCompletionDate && <Text fontSize="sm" color="fg.default">—</Text>
              )}
            </InfoRow>

            <InfoRow label="Создан">
              <Text fontSize="sm" color="fg.default">{formatDate(ticket.createdAt)}</Text>
            </InfoRow>

            {ticket.resolvedAt && (
                <InfoRow label="Решён">
                  <Text fontSize="sm" color="fg.default">{formatDate(ticket.resolvedAt)}</Text>
                </InfoRow>
            )}

            <HStack justify="space-between" pt={1}>
              <HStack color="fg.muted" fontSize="xs" gap={1}>
                <LuClock size={12}/>
                <Text>{formatDuration(timeSpentSeconds)}</Text>
              </HStack>
              <HStack color="fg.muted" fontSize="xs" gap={1}>
                <LuMessageSquare size={12}/>
                <Text>{ticket.messageCount}</Text>
              </HStack>
              <HStack color="fg.muted" fontSize="xs" gap={1}>
                <LuPaperclip size={12}/>
                <Text>{ticket.attachmentCount}</Text>
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {/* Co-executors: specialists see full panel with add/remove, users see read-only list */}
        <CoExecutorPanel ticket={ticket} canEdit={isSpecialist}/>
      </VStack>
  );
}
