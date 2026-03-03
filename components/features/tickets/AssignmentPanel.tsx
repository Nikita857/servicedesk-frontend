import { assignmentApi, Assignment } from "@/lib/api/assignments";
import { formatDate, toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Collapsible,
  HStack,
  Heading,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuForward,
  LuHistory,
  LuX,
} from "react-icons/lu";
import { useState } from "react";

interface AssignmentPanelProps {
  currentAssignment: Assignment | null;
  assignmentHistory: Assignment[];
  isSpecialist: boolean;
  currentUsername?: string;
  onDecision?: () => void;
}

/**
 * Панель назначений - объединяет текущее назначение и историю
 * Выводится под чатом в деталях тикета
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
    } catch {
      toast.error("Ошибка", "Не удалось принять назначение");
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
    } catch {
      toast.error("Ошибка", "Не удалось отклонить назначение");
    } finally {
      setIsRejecting(false);
    }
  };

  // Не показываем панель если нет данных или пользователь не специалист
  if (!isSpecialist || (!currentAssignment && assignmentHistory.length === 0)) {
    return null;
  }

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      p={4}
      mt={4}
    >
      <HStack mb={4}>
        <LuForward size={18} />
        <Heading size="sm" color="fg.default">
          Назначение
        </Heading>
      </HStack>

      {/* Текущее назначение */}
      {currentAssignment && (
        <Box
          bg="blue.50"
          borderRadius="lg"
          p={3}
          mb={assignmentHistory.length > 0 ? 3 : 0}
          _dark={{ bg: "blue.900/20" }}
        >
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="medium" fontSize="sm">
              Текущее
            </Text>
            <Badge
              size="sm"
              colorPalette={
                currentAssignment.status === "ACCEPTED"
                  ? "green"
                  : currentAssignment.status === "REJECTED"
                  ? "red"
                  : "yellow"
              }
            >
              {currentAssignment.status === "ACCEPTED"
                ? "Принято"
                : currentAssignment.status === "REJECTED"
                ? "Отклонено"
                : "Ожидает"}
            </Badge>
          </HStack>

          <VStack align="stretch" gap={1} fontSize="sm">
            <HStack justify="space-between">
              <Text color="fg.muted">Кому:</Text>
              <Text>
                {currentAssignment.toFio ||
                  currentAssignment.toUsername ||
                  currentAssignment.toLineName}
              </Text>
            </HStack>

            {currentAssignment.fromFio && (
              <HStack justify="space-between">
                <Text color="fg.muted">От:</Text>
                <Text>
                  {currentAssignment.fromFio || currentAssignment.fromUsername}
                </Text>
              </HStack>
            )}

            {currentAssignment.note && (
              <Box mt={1}>
                <Text color="fg.muted" fontSize="xs">
                  Комментарий:
                </Text>
                <Text fontSize="sm">{currentAssignment.note}</Text>
              </Box>
            )}

            <Text color="fg.muted" fontSize="xs" mt={1}>
              {formatDate(currentAssignment.createdAt)}
            </Text>
          </VStack>

          {isPendingForMe && (
            <Box mt={3} pt={3} borderTopWidth="1px" borderColor="blue.200" _dark={{ borderColor: "blue.700" }}>
              {showRejectForm ? (
                <VStack align="stretch" gap={2}>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Укажите причину отклонения"
                    rows={2}
                    size="sm"
                  />
                  <HStack gap={2} justify="flex-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                      disabled={isRejecting}
                    >
                      Назад
                    </Button>
                    <Button
                      colorPalette="red"
                      size="sm"
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
                <HStack gap={2} justify="flex-end">
                  <Button
                    variant="outline"
                    colorPalette="red"
                    size="sm"
                    onClick={() => setShowRejectForm(true)}
                  >
                    <LuX />
                    Отклонить
                  </Button>
                  <Button
                    colorPalette="green"
                    size="sm"
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
        </Box>
      )}

      {/* История назначений - только для специалистов */}
      {isSpecialist && assignmentHistory.length > 0 && (
        <Collapsible.Root
          open={showHistory}
          onOpenChange={(e) => setShowHistory(e.open)}
        >
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              w="full"
              justifyContent="space-between"
            >
              <HStack>
                <LuHistory size={14} />
                <Text>История назначений ({assignmentHistory.length})</Text>
              </HStack>
              {showHistory ? <LuChevronUp /> : <LuChevronDown />}
            </Button>
          </Collapsible.Trigger>

          <Collapsible.Content>
            <VStack align="stretch" gap={2} mt={2}>
              {assignmentHistory.map((a) => (
                <Box
                  key={a.id}
                  p={2}
                  bg="bg.subtle"
                  borderRadius="md"
                  fontSize="xs"
                >
                  <HStack justify="space-between" mb={1}>
                    <HStack>
                      <Text fontWeight="medium">{a.toLineName}</Text>
                      <Badge
                        size="xs"
                        colorPalette={
                          a.status === "ACCEPTED"
                            ? "green"
                            : a.status === "REJECTED"
                            ? "red"
                            : "gray"
                        }
                      >
                        {a.status === "ACCEPTED"
                          ? "✓"
                          : a.status === "REJECTED"
                          ? "✗"
                          : "..."}
                      </Badge>
                    </HStack>
                    <Text color="fg.muted">{formatDate(a.createdAt)}</Text>
                  </HStack>
                  {a.toFio && <Text color="fg.muted">→ {a.toFio}</Text>}
                  {a.note && (
                    <Text color="fg.muted" lineClamp={2} mt={1}>
                      {a.note}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  );
}
