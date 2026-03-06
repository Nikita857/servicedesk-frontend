import { assignmentApi } from "@/lib/api/assignments";
import type { AssignmentResponse } from "@/types/assignment";
import { formatDate, handleApiError, toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Collapsible,
  HStack,
  Icon,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuArrowRight,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuClock,
  LuForward,
  LuX,
} from "react-icons/lu";
import { useState } from "react";

interface AssignmentPanelProps {
  currentAssignment: AssignmentResponse | null;
  assignmentHistory: AssignmentResponse[];
  isSpecialist: boolean;
  currentUsername?: string;
  onDecision?: () => void;
}

/** Форматирует отправителя назначения */
function assignmentFrom(a: AssignmentResponse): string {
  return a.fromFio || a.fromUsername || a.fromLineName || "—";
}

/** Форматирует получателя назначения */
function assignmentTo(a: AssignmentResponse): string {
  return a.toFio || a.toUsername || a.toLineName || "—";
}

const STATUS_ICON = {
  ACCEPTED: { icon: LuCheck, color: "green.500" },
  REJECTED: { icon: LuX, color: "red.500" },
  PENDING: { icon: LuClock, color: "yellow.500" },
} as const;

/**
 * Панель назначений — компактный timeline.
 * Выводится под чатом в деталях тикета.
 */
export default function AssignmentPanel({
  currentAssignment,
  assignmentHistory,
  isSpecialist,
  currentUsername,
  onDecision,
}: AssignmentPanelProps) {
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isPendingForMe =
    currentAssignment?.status === "PENDING" &&
    currentAssignment.toUsername === currentUsername;

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  };

  const handleAccept = async () => {
    if (!currentAssignment) return;
    setIsAccepting(true);
    try {
      await assignmentApi.accept(currentAssignment.id);
      toast.success("Назначение принято");
      invalidateCaches();
      onDecision?.();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!currentAssignment || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await assignmentApi.reject(currentAssignment.id, rejectReason.trim());
      toast.success("Назначение отклонено");
      invalidateCaches();
      setShowRejectForm(false);
      setRejectReason("");
      onDecision?.();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isSpecialist || (!currentAssignment && assignmentHistory.length === 0)) {
    return null;
  }

  const historyCount = assignmentHistory.length;

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
      mt={4}
    >
      {/* Заголовок */}
      <HStack px={3} py={2} borderBottomWidth="1px" borderColor="border.default" gap={2}>
        <LuForward size={14} color="var(--chakra-colors-fg-muted)" />
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Назначения
        </Text>
        {historyCount > 0 && (
          <Text fontSize="xs" color="fg.subtle" ml="auto">
            {historyCount} в истории
          </Text>
        )}
      </HStack>

      {/* Pending — action card (требует действия от текущего специалиста) */}
      {isPendingForMe && currentAssignment && (
        <Box
          px={3} py={2}
          bg="orange.50"
          borderBottomWidth="1px"
          borderColor="orange.200"
          _dark={{ bg: "orange.900/20", borderColor: "orange.800" }}
        >
          <HStack justify="space-between" mb={2}>
            <HStack gap={1.5}>
              <Icon as={LuClock} boxSize={3.5} color="orange.500" />
              <Text fontSize="xs" fontWeight="semibold" color="orange.700" _dark={{ color: "orange.300" }}>
                Требует вашего решения
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.muted">{formatDate(currentAssignment.createdAt)}</Text>
          </HStack>

          <Text fontSize="xs" color="fg.muted" mb={1}>
            {assignmentFrom(currentAssignment)}
            <Box as="span" mx={1} color="fg.subtle"><LuArrowRight style={{ display: "inline" }} size={10} /></Box>
            <Box as="span" fontWeight="medium" color="fg.default">{assignmentTo(currentAssignment)}</Box>
            {currentAssignment.toLineName && (
              <Box as="span" color="fg.muted"> · {currentAssignment.toLineName}</Box>
            )}
          </Text>

          {currentAssignment.note && (
            <Text fontSize="xs" color="fg.muted" fontStyle="italic" mb={2} lineClamp={2}>
              {currentAssignment.note}
            </Text>
          )}

          {showRejectForm ? (
            <VStack align="stretch" gap={2} mt={2}>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Укажите причину отклонения"
                rows={2}
                size="xs"
              />
              <HStack gap={2} justify="flex-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                  disabled={isRejecting}
                >
                  Назад
                </Button>
                <Button
                  colorPalette="red"
                  size="xs"
                  onClick={handleReject}
                  loading={isRejecting}
                  disabled={!rejectReason.trim()}
                >
                  <LuX />
                  Отклонить
                </Button>
              </HStack>
            </VStack>
          ) : (
            <HStack gap={2} justify="flex-end" mt={2}>
              <Button
                variant="outline"
                colorPalette="red"
                size="xs"
                onClick={() => setShowRejectForm(true)}
              >
                <LuX />
                Отклонить
              </Button>
              <Button
                colorPalette="green"
                size="xs"
                onClick={handleAccept}
                loading={isAccepting}
              >
                <LuCheck />
                Принять
              </Button>
            </HStack>
          )}
        </Box>
      )}

      {/* Текущее назначение (не pending для меня) */}
      {currentAssignment && !isPendingForMe && (
        <AssignmentRow a={currentAssignment} />
      )}

      {/* История */}
      {historyCount > 0 && (
        <Collapsible.Root open={showHistory} onOpenChange={(e) => setShowHistory(e.open)}>
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              size="xs"
              w="full"
              justifyContent="space-between"
              px={3}
              py={2}
              h="auto"
              borderTopWidth={currentAssignment ? "1px" : "0"}
              borderColor="border.default"
              borderRadius="0"
              color="fg.muted"
              _hover={{ bg: "bg.subtle" }}
            >
              <Text fontSize="xs">История назначений</Text>
              {showHistory ? <LuChevronUp size={12} /> : <LuChevronDown size={12} />}
            </Button>
          </Collapsible.Trigger>

          <Collapsible.Content>
            <VStack align="stretch" gap={0} divideY="1px">
              {assignmentHistory.map((a) => (
                <AssignmentRow key={a.id} a={a} dimmed />
              ))}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  );
}

/** Одна строка назначения в timeline */
function AssignmentRow({ a, dimmed = false }: { a: AssignmentResponse; dimmed?: boolean }) {
  const statusConf = STATUS_ICON[a.status] ?? STATUS_ICON.PENDING;
  const to = assignmentTo(a);
  const from = a.fromFio || a.fromUsername || a.fromLineName;

  return (
    <HStack
      px={3} py={2}
      gap={2.5}
      align="flex-start"
      opacity={dimmed ? 0.75 : 1}
      _hover={{ bg: "bg.subtle" }}
    >
      {/* Статус-иконка */}
      <Icon as={statusConf.icon} boxSize={3.5} color={statusConf.color} mt="1px" flexShrink={0} />

      {/* Направление */}
      <Box flex={1} minW={0}>
        <HStack gap={1} flexWrap="wrap">
          {from && (
            <>
              <Text fontSize="xs" color="fg.muted" lineClamp={1}>{from}</Text>
              <Icon as={LuArrowRight} boxSize={3} color="fg.subtle" flexShrink={0} />
            </>
          )}
          <Text fontSize="xs" fontWeight="medium" color="fg.default" lineClamp={1}>{to}</Text>
          {a.toLineName && (a.toFio || a.toUsername) && (
            <Text fontSize="xs" color="fg.muted">· {a.toLineName}</Text>
          )}
        </HStack>

        {a.rejectedReason && (
          <Text fontSize="xs" color="red.500" mt={0.5} lineClamp={1}>
            {a.rejectedReason}
          </Text>
        )}
      </Box>

      {/* Дата */}
      <Text fontSize="xs" color="fg.subtle" flexShrink={0} whiteSpace="nowrap">
        {formatDate(a.createdAt)}
      </Text>
    </HStack>
  );
}
