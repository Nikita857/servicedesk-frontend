"use client";

import { useState } from "react";
import { Box, Button, Collapsible, HStack, Text, VStack } from "@chakra-ui/react";
import { LuChevronDown, LuChevronUp, LuCircleAlert } from "react-icons/lu";
import { useClosureRejectionsQuery } from "@/lib/hooks/ticket-detail/useClosureRejectionsQuery";
import { formatDate } from "@/lib/utils";

interface ClosureRejectionBannerProps {
  ticketId: number;
}

/**
 * Показывает причину(ы) отклонения закрытия тикета автором.
 * Видно, пока в истории тикета есть хотя бы одно отклонение закрытия.
 */
export function ClosureRejectionBanner({
  ticketId,
}: ClosureRejectionBannerProps) {
  const { data: rejections } = useClosureRejectionsQuery(ticketId);
  const [open, setOpen] = useState(true);

  if (!rejections || rejections.length === 0) return null;

  const [latest, ...older] = rejections;
  const rejectedBy = latest.changedByFio || latest.changedByUsername;

  return (
    <Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Box
        bg="red.50"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="red.200"
        overflow="hidden"
        mb={3}
        _dark={{ bg: "red.900/20", borderColor: "red.700" }}
      >
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            w="full"
            justifyContent="space-between"
            px={3}
            py={2}
            h="auto"
            borderRadius="none"
            _hover={{ bg: "red.100", _dark: { bg: "red.900/40" } }}
          >
            <HStack gap={2}>
              <Box color="red.500">
                <LuCircleAlert size={16} />
              </Box>
              <Text
                fontWeight="semibold"
                color="red.700"
                fontSize="sm"
                _dark={{ color: "red.300" }}
              >
                Закрытие отклонено{rejectedBy ? ` — ${rejectedBy}` : ""}
                {rejections.length > 1 ? ` (${rejections.length})` : ""}
              </Text>
            </HStack>
            {open ? (
              <LuChevronUp size={14} color="var(--chakra-colors-red-500)" />
            ) : (
              <LuChevronDown size={14} color="var(--chakra-colors-red-500)" />
            )}
          </Button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <Box px={3} pb={3}>
            <Box>
              {latest.comment && (
                <Text
                  fontSize="sm"
                  color="red.700"
                  whiteSpace="pre-wrap"
                  _dark={{ color: "red.200" }}
                >
                  {latest.comment}
                </Text>
              )}
              <Text
                fontSize="xs"
                color="red.600"
                mt={1}
                _dark={{ color: "red.300" }}
              >
                {formatDate(latest.enteredAt)}
              </Text>
            </Box>

            {older.length > 0 && (
              <Box
                mt={3}
                pt={3}
                borderTopWidth="1px"
                borderColor="red.200"
                _dark={{ borderColor: "red.700" }}
              >
                <VStack align="stretch" gap={2}>
                  {older.map((rejection) => (
                    <Box key={rejection.id}>
                      <Text
                        fontSize="xs"
                        fontWeight="medium"
                        color="red.700"
                        _dark={{ color: "red.300" }}
                      >
                        {rejection.changedByFio || rejection.changedByUsername}
                        {" · "}
                        {formatDate(rejection.enteredAt)}
                      </Text>
                      {rejection.comment && (
                        <Text
                          fontSize="xs"
                          color="red.600"
                          _dark={{ color: "red.200" }}
                        >
                          {rejection.comment}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
}
