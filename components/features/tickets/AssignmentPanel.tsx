import { assignmentApi } from "@/lib/api/assignments";
import type { AssignmentResponse } from "@/types/assignment";
import { formatDate, handleApiError, toast } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Collapsible,
  Flex,
  HStack,
  Icon,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuArrowRight,
  LuBan,
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

function assignmentFrom(a: AssignmentResponse): string {
  return a.fromUser?.fio || a.fromUser?.username || a.fromLine?.name || "—";
}
function assignmentTo(a: AssignmentResponse): string {
  return a.toUser?.fio || a.toUser?.username || a.toLine?.name || "—";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

// Стабильный цвет аватара по имени
function avatarPalette(name: string): { bg: string; fg: string } {
  const palettes = [
    { bg: "blue.100", fg: "blue.700" },
    { bg: "purple.100", fg: "purple.700" },
    { bg: "orange.100", fg: "orange.700" },
    { bg: "green.100", fg: "green.700" },
    { bg: "pink.100", fg: "pink.700" },
    { bg: "teal.100", fg: "teal.700" },
  ];
  const idx = name.charCodeAt(0) % palettes.length;
  return palettes[idx];
}

const STATUS_CONF = {
  ACCEPTED: { icon: LuCheck, color: "green.500", bg: "green.50" },
  REJECTED: { icon: LuX, color: "red.500", bg: "red.50" },
  PENDING: { icon: LuClock, color: "yellow.500", bg: "yellow.50" },
  CANCELLED: { icon: LuBan, color: "gray.500", bg: "gray.100" },
} as const;

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
    currentAssignment.toUser?.username === currentUsername;

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
  const totalEvents = historyCount + (currentAssignment ? 1 : 0);

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
      mt={4}
    >
      {/* ── Заголовок с иконкой-бейджем ────────────────────────────────── */}
      <HStack
        px={3}
        py={3}
        gap={2.5}
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border.default"
      >
        <Flex
          w="28px"
          h="28px"
          borderRadius="md"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          align="center"
          justify="center"
          color="fg.muted"
          flexShrink={0}
        >
          <LuForward size={14} />
        </Flex>
        <Box>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.default"
            lineHeight="1.2"
          >
            Назначения
          </Text>
          <Text fontSize="xs" color="fg.muted" mt="1px">
            {totalEvents}{" "}
            {pluralize(totalEvents, ["событие", "события", "событий"])}
          </Text>
        </Box>
      </HStack>

      {/* ── Контент ────────────────────────────────────────────────────── */}
      <VStack align="stretch" gap={2.5} p={3}>
        {/* Pending action card */}
        {isPendingForMe && currentAssignment && (
          <Box
            bgGradient="linear(to-b, orange.50, transparent)"
            bg={{ base: "orange.50", _dark: "orange.900/20" }}
            borderWidth="1px"
            borderColor="orange.200"
            _dark={{ borderColor: "orange.800" }}
            borderRadius="lg"
            p={3}
            boxShadow="0 1px 2px rgba(221, 107, 32, 0.08)"
          >
            {/* Бейдж "Требует решения" */}
            <HStack
              display="inline-flex"
              bg="orange.500"
              color="white"
              px={2}
              py={0.5}
              borderRadius="full"
              gap={1}
              mb={2.5}
            >
              <Icon as={LuClock} boxSize={2.5} />
              <Text
                fontSize="2xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Требует решения
              </Text>
            </HStack>

            {/* From → To */}
            <HStack gap={2.5} mb={2.5}>
              <Avatar name={assignmentFrom(currentAssignment)} size="28px" />
              <Box flex={1} minW={0}>
                <Text fontSize="2xs" color="fg.muted" lineHeight="1">
                  От
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.default"
                  truncate
                  mt="2px"
                >
                  {assignmentFrom(currentAssignment)}
                </Text>
              </Box>
              <Icon
                as={LuArrowRight}
                boxSize={3.5}
                color="fg.subtle"
                flexShrink={0}
              />
              <Box flex={1} minW={0} textAlign="right">
                <Text fontSize="2xs" color="fg.muted" lineHeight="1">
                  Вам
                  {currentAssignment.toLine?.name &&
                    ` · ${currentAssignment.toLine?.name}`}
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="orange.700"
                  _dark={{ color: "orange.300" }}
                  truncate
                  mt="2px"
                >
                  {assignmentTo(currentAssignment)}
                </Text>
              </Box>
            </HStack>

            {/* Note */}
            {currentAssignment.note && (
              <Box
                bg="bg.surface"
                borderWidth="1px"
                borderColor="border.muted"
                borderRadius="md"
                px={2.5}
                py={2}
                mb={2.5}
              >
                <Text fontSize="sm" color="fg.default" lineHeight="1.45">
                  {currentAssignment.note}
                </Text>
              </Box>
            )}

            {/* Actions */}
            {showRejectForm ? (
              <VStack align="stretch" gap={2}>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Укажите причину отклонения"
                  rows={2}
                  size="xs"
                  bg="bg.surface"
                />
                <HStack gap={2} justify="flex-end">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
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
                    <LuX /> Отклонить
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <HStack gap={2}>
                <Button
                  variant="outline"
                  colorPalette="red"
                  size="xs"
                  flex={1}
                  onClick={() => setShowRejectForm(true)}
                >
                  <LuX /> Отклонить
                </Button>
                <Button
                  colorPalette="green"
                  size="xs"
                  flex={1}
                  onClick={handleAccept}
                  loading={isAccepting}
                >
                  <LuCheck /> Принять
                </Button>
              </HStack>
            )}

            <Text
              fontSize="2xs"
              color="fg.subtle"
              textAlign="right"
              mt={2}
              fontVariantNumeric="tabular-nums"
            >
              Назначено · {formatDate(currentAssignment.createdAt)}
            </Text>
          </Box>
        )}

        {/* Текущее (не pending для меня) */}
        {currentAssignment && !isPendingForMe && (
          <AssignmentCard a={currentAssignment} />
        )}

        {/* История — toggle */}
        {historyCount > 0 && (
          <Collapsible.Root
            open={showHistory}
            onOpenChange={(e) => setShowHistory(e.open)}
          >
            <Collapsible.Trigger asChild>
              <Button
                w="full"
                size="xs"
                variant="ghost"
                bg="bg.subtle"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="border.default"
                borderRadius="md"
                color="fg.muted"
                fontWeight="medium"
                _hover={{ bg: "bg.muted" }}
              >
                {showHistory ? "Скрыть" : `Показать историю · ${historyCount}`}
                {showHistory ? <LuChevronUp /> : <LuChevronDown />}
              </Button>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <VStack align="stretch" gap={1.5} mt={2}>
                {assignmentHistory.map((a) => (
                  <AssignmentCard key={a.id} a={a} />
                ))}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </VStack>
    </Box>
  );
}

/** Одно назначение в виде компактной карточки */
function AssignmentCard({ a }: { a: AssignmentResponse }) {
  const conf = STATUS_CONF[a.status] ?? STATUS_CONF.PENDING;

  return (
    <HStack
      align="flex-start"
      gap={2.5}
      px={2.5}
      py={2}
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      _hover={{ bg: "bg.subtle", borderColor: "border.default" }}
      transition="background 0.12s, border-color 0.12s"
    >
      {/* Статус-кружок */}
      <Flex
        w="22px"
        h="22px"
        borderRadius="full"
        bg={conf.bg}
        color={conf.color}
        align="center"
        justify="center"
        flexShrink={0}
        mt="1px"
      >
        <Icon as={conf.icon} boxSize={3} />
      </Flex>

      {/* Содержимое */}
      <Box flex={1} minW={0}>
        <HStack gap={1.5} flexWrap="wrap">
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {assignmentFrom(a)}
          </Text>
          <Icon
            as={LuArrowRight}
            boxSize={2.5}
            color="fg.subtle"
            flexShrink={0}
          />
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.default"
            lineClamp={1}
          >
            {assignmentTo(a)}
          </Text>
          {a.toLine.name && (a.toUser?.fio || a.toUser?.username) && (
            <Text
              fontSize="2xs"
              color="fg.muted"
              bg="bg.muted"
              px={1.5}
              py="1px"
              borderRadius="sm"
              flexShrink={0}
            >
              {a.toLine?.name}
            </Text>
          )}
        </HStack>

        {a.rejectedReason && (
          <Text fontSize="xs" color="red.600" mt={1} lineClamp={2}>
            «{a.rejectedReason}»
          </Text>
        )}
      </Box>

      {/* Дата */}
      <Text
        fontSize="2xs"
        color="fg.subtle"
        flexShrink={0}
        whiteSpace="nowrap"
        fontVariantNumeric="tabular-nums"
      >
        {formatDate(a.createdAt)}
      </Text>
    </HStack>
  );
}

/** Аватар с инициалами и стабильным цветом по имени */
function Avatar({ name, size = "24px" }: { name: string; size?: string }) {
  const { bg, fg } = avatarPalette(name);
  const initials = getInitials(name);
  const fontSize = `calc(${size} * 0.4)`;

  return (
    <Flex
      w={size}
      h={size}
      borderRadius="full"
      bg={bg}
      color={fg}
      align="center"
      justify="center"
      fontSize={fontSize}
      fontWeight="bold"
      flexShrink={0}
    >
      {initials}
    </Flex>
  );
}

/** Простая плюрализация для русского */
function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return forms[1];
  return forms[2];
}
