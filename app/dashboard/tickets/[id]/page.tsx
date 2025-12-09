'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Spinner,
  HStack,
  VStack,
  Grid,
  GridItem,
  Separator,
} from '@chakra-ui/react';
import { LuArrowLeft, LuClock, LuUser, LuMessageSquare, LuPaperclip } from 'react-icons/lu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ticketApi } from '@/lib/api/tickets';
import { toaster } from '@/components/ui/toaster';
import { TicketChat } from '@/components/features/tickets';
import type { Ticket, TicketStatus } from '@/types/ticket';
import { ticketStatusConfig, ticketPriorityConfig } from '@/types/ticket';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await ticketApi.get(Number(id));
        setTicket(data);
      } catch (error) {
        toaster.error({
          title: 'Ошибка',
          description: 'Не удалось загрузить тикет',
        });
        router.push('/dashboard/tickets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [id, router]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const updated = await ticketApi.changeStatus(ticket.id, { status: newStatus });
      setTicket(updated);
      toaster.success({
        title: 'Статус изменен',
        description: `Тикет переведен в статус "${ticketStatusConfig[newStatus].label}"`,
      });
    } catch (error) {
      toaster.error({
        title: 'Ошибка',
        description: 'Не удалось изменить статус',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!ticket) return null;

  const statusConf = ticketStatusConfig[ticket.status];
  const priorityConf = ticketPriorityConfig[ticket.priority];

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="flex-start" wrap="wrap" gap={4}>
        <Box>
          <HStack mb={2}>
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="sm">
                <LuArrowLeft />
                Назад
              </Button>
            </Link>
          </HStack>
          <Heading size="lg" color="fg.default" mb={2}>
            #{ticket.id}: {ticket.title}
          </Heading>
          <HStack gap={3}>
            <Badge colorPalette={statusConf.color} size="lg">
              {statusConf.label}
            </Badge>
            <Badge colorPalette={priorityConf.color} variant="subtle" size="md">
              {priorityConf.label}
            </Badge>
          </HStack>
        </Box>

        <HStack gap={2}>
          {ticket.status === 'NEW' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('OPEN')}>
              Взять в работу
            </Button>
          )}
          {ticket.status === 'OPEN' && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('PENDING')}>
                Ожидание
              </Button>
              <Button size="sm" bg="green.600" color="white" onClick={() => handleStatusChange('RESOLVED')}>
                Решено
              </Button>
            </>
          )}
          {ticket.status === 'RESOLVED' && (
            <Button size="sm" bg="gray.700" color="white" onClick={() => handleStatusChange('CLOSED')}>
              Закрыть
            </Button>
          )}
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
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
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            <Heading size="md" mb={4} color="fg.default">
              Информация
            </Heading>
            
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                  Автор
                </Text>
                <HStack>
                  <LuUser size={16} />
                  <Text color="fg.default">{ticket.createdBy.fio || ticket.createdBy.username}</Text>
                </HStack>
              </Box>

              <Separator />

              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                  Исполнитель
                </Text>
                <Text color="fg.default">
                  {ticket.assignedTo ? (ticket.assignedTo.fio || ticket.assignedTo.username) : '—'}
                </Text>
              </Box>

              <Separator />

              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                  Линия поддержки
                </Text>
                <Text color="fg.default">
                  {ticket.supportLine?.name || '—'}
                </Text>
              </Box>

              <Separator />

              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                  Категория (пользователь)
                </Text>
                <Text color="fg.default">
                  {ticket.categoryUser?.name || '—'}
                </Text>
              </Box>

              <Separator />

              <HStack justify="space-between">
                <HStack color="fg.muted" fontSize="sm">
                  <LuClock size={14} />
                  <Text>{formatDuration(ticket.timeSpentSeconds)}</Text>
                </HStack>
                <HStack color="fg.muted" fontSize="sm">
                  <LuMessageSquare size={14} />
                  <Text>{ticket.messageCount}</Text>
                </HStack>
                <HStack color="fg.muted" fontSize="sm">
                  <LuPaperclip size={14} />
                  <Text>{ticket.attachmentCount}</Text>
                </HStack>
              </HStack>

              <Separator />

              <Box>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                  Создан
                </Text>
                <Text color="fg.default" fontSize="sm">
                  {formatDate(ticket.createdAt)}
                </Text>
              </Box>

              {ticket.resolvedAt && (
                <Box>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase" mb={1}>
                    Решён
                  </Text>
                  <Text color="fg.default" fontSize="sm">
                    {formatDate(ticket.resolvedAt)}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
