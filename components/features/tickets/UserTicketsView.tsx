import {
  Box,
  Flex,
  Heading,
  Spinner,
  HStack,
  Button,
  VStack,
  Center,
  Text,
} from "@chakra-ui/react";
import { SDPagination } from "@/components/ui/SDPagination";
import Link from "next/link";
import { LuPlus } from "react-icons/lu";
import { TicketCard } from "./TicketCard";
import { useTicketsQuery, useTicketsWebSocket } from "@/lib/hooks";
import type { TicketStatus } from "@/types/ticket";

interface UserTicketsViewProps {
  status?: TicketStatus;
  hideHeader?: boolean;
  pageSize?: number;
  currentUserName?: string;
}

export const UserTicketsView = ({
  status,
  hideHeader = false,
  pageSize
}: UserTicketsViewProps) => {
  const { data, meta, optimistic, actions } = useTicketsQuery({
    pageSize,
  });

  useTicketsWebSocket({
    onNewTicket: (ticket) => {
      optimistic.addTicket(ticket);
    },
    enabled: true,
  });

  const content = data?.content ?? [];
  const tickets = status ? content.filter((t) => t.status === status) : content;

  return (
    <Box>
      {!hideHeader && (
        <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="fg.default" mb={1}>
              Мои обращения
              {meta.isFetching && !meta.isLoading && (
                <Spinner size="sm" ml={2} color="gray.400" />
              )}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Управление обращениями
            </Text>
          </Box>

          <HStack gap={3}>
            <Link href="/dashboard/tickets/new">
              <Button
                size="sm"
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
              >
                <LuPlus />
                Новый тикет
              </Button>
            </Link>
          </HStack>
        </Flex>
      )}

      {meta.isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="lg" />
        </Flex>
      ) : tickets.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="200px"
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
        >
          <Text color="fg.muted">Тикеты не найдены</Text>
          {!hideHeader && (
            <Link href="/dashboard/tickets/new">
              <Button mt={4} size="sm" variant="outline">
                Создать первый тикет
              </Button>
            </Link>
          )}
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
            />
          ))}

          {!status && data && data.page.totalPages > 1 && (
            <Center>
              <SDPagination
                page={data.page}
                action={actions.setPage}
                size="sm"
              />
            </Center>
          )}
        </VStack>
      )}
    </Box>
  );
}
