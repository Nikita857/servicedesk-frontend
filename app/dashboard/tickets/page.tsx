'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  HStack,
  VStack,
  IconButton,
  Portal,
  createListCollection,
} from '@chakra-ui/react';
import { Select } from '@chakra-ui/react';
import { LuPlus, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import Link from 'next/link';
import { ticketApi } from '@/lib/api/tickets';
import { toaster } from '@/components/ui/toaster';
import type { TicketListItem, PagedTicketList } from '@/types/ticket';
import { TicketCard } from '@/components/features/tickets';

type FilterType = 'all' | 'my' | 'assigned';

const filterCollection = createListCollection({
  items: [
    { label: 'Все тикеты', value: 'all' },
    { label: 'Мои тикеты', value: 'my' },
    { label: 'Назначенные мне', value: 'assigned' },
  ],
});

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      let response: PagedTicketList;
      
      switch (filter) {
        case 'my':
          response = await ticketApi.listMy(page, 5);
          break;
        case 'assigned':
          response = await ticketApi.listAssigned(page, 5);
          break;
        default:
          response = await ticketApi.list(page, 5);
      }
      
      setTickets(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      toaster.error({
        title: 'Ошибка',
        description: 'Не удалось загрузить список тикетов',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Тикеты
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Управление заявками пользователей
          </Text>
        </Box>
        
        <HStack gap={3}>
          {/* Filter */}
          <Select.Root
            collection={filterCollection}
            value={[filter]}
            onValueChange={(e) => {
              setFilter(e.value[0] as FilterType);
              setPage(0);
            }}
            size="sm"
            width="180px"
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Фильтр" />
            </Select.Trigger>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {filterCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          <Link href="/dashboard/tickets/new">
            <Button size="sm" bg="gray.900" color="white" _hover={{ bg: 'gray.800' }}>
              <LuPlus />
              Создать
            </Button>
          </Link>
        </HStack>
      </Flex>

      {/* Tickets Grid */}
      {isLoading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner size="xl" />
        </Flex>
      ) : tickets.length === 0 ? (
        <Flex
          justify="center"
          align="center"
          h="300px"
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
        </VStack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" mt={6} gap={4}>
          <IconButton
            aria-label="Предыдущая"
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <LuChevronLeft />
          </IconButton>
          <Text color="fg.muted" fontSize="sm">
            {page + 1} / {totalPages}
          </Text>
          <IconButton
            aria-label="Следующая"
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <LuChevronRight />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
}
