"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  VStack,
  HStack,
  Button,
  Center,
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import Link from "next/link";
import { ticketApi } from "@/lib/api/tickets";
import { queryKeys } from "@/lib/queryKeys";
import { TicketCard } from "./TicketCard";
import { SDPagination } from "@/components/ui/SDPagination";

const PAGE_SIZE = 7;

export function AdminTicketsView() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.tickets.list({ filter: "all", page }),
    queryFn: () => ticketApi.list(page, PAGE_SIZE),
    staleTime: 30 * 1000,
  });

  const tickets = data?.content ?? [];

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Все тикеты
            {isFetching && !isLoading && (
              <Spinner size="sm" ml={2} color="gray.400" />
            )}
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Просмотр всех тикетов системы
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

      {/* Content */}
      {isLoading ? (
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
        </Flex>
      ) : (
        <VStack gap={3} align="stretch">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}

          {data && data.page.totalPages > 1 && (
            <Center>
              <SDPagination
                page={data.page}
                action={setPage}
                size="sm"
              />
            </Center>
          )}
        </VStack>
      )}
    </Box>
  );
}
