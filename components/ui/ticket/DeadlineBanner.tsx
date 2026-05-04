import { useScheduledTaskDeadlineQuery } from "@/lib/hooks/ticket-detail/useScheduledtaskDeadlineQuery";
import { formatDate } from "@/lib/utils";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuClock } from "react-icons/lu";

interface IProps {
  ticketId: number;
}

export default function DeadlineBanner({ ticketId }: IProps) {
  const deadlineInfo = useScheduledTaskDeadlineQuery(ticketId);
  return (
    <>
      {deadlineInfo.data?.deadlineAt && (
        <Box
          bg="orange.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="orange.200"
          p={3}
          mb={3}
          _dark={{ bg: "orange.900/20", borderColor: "orange.700" }}
        >
          <HStack gap={2}>
            <LuClock color="var(--chakra-colors-orange-500)" size={16} />
            <Text
              fontWeight="semibold"
              color="orange.700"
              fontSize="sm"
              _dark={{ color: "orange.300" }}
            >
              Задача ограничена по времени
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            color="orange.600"
            mt={1}
            _dark={{ color: "orange.200" }}
          >
            Срок выполнения: {formatDate(deadlineInfo.data?.deadlineAt)}
          </Text>
        </Box>
      )}
    </>
  );
}
