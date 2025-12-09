'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Spinner,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { LuSend, LuWifi, LuWifiOff } from 'react-icons/lu';
import { messageApi } from '@/lib/api/messages';
import { ticketWebSocket, type ChatMessageWS } from '@/lib/websocket/ticketWebSocket';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores';
import type { Message } from '@/types/message';
import { senderTypeConfig, type SenderType } from '@/types/message';

interface TicketChatProps {
  ticketId: number;
}

export function TicketChat({ ticketId }: TicketChatProps) {
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      await messageApi.markAsRead(ticketId);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  // Connect to WebSocket
  useEffect(() => {
    fetchMessages();

    if (accessToken) {
      ticketWebSocket.connect(ticketId, accessToken, {
        onConnect: () => {
          setIsConnected(true);
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
        onMessage: (wsMessage: ChatMessageWS) => {
          // Convert WS message to Message format
          const newMsg: Message = {
            id: wsMessage.id,
            ticketId: wsMessage.ticketId,
            content: wsMessage.content,
            sender: {
              id: wsMessage.senderId,
              username: wsMessage.senderUsername,
              fio: wsMessage.senderFio,
            },
            senderType: wsMessage.senderType as SenderType,
            internal: wsMessage.internal,
            readByUser: false,
            readBySpecialist: false,
            edited: false,
            createdAt: wsMessage.createdAt,
            updatedAt: wsMessage.createdAt,
          };

          // Add message if not already exists
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        },
        onError: (error) => {
          console.error('[WS] Error:', error);
        },
      });
    }

    return () => {
      ticketWebSocket.disconnect();
    };
  }, [ticketId, accessToken, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Try WebSocket first
    if (isConnected && ticketWebSocket.sendMessage(content)) {
      // Message sent via WebSocket, will appear via subscription
      return;
    }

    // Fallback to REST API
    setIsSending(true);
    try {
      const message = await messageApi.send(ticketId, { content });
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      toaster.error({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
      });
      setNewMessage(content); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getInitials = (name: string | null, username: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      h="500px"
    >
      {/* Header */}
      <Flex
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor="border.default"
        justify="space-between"
        align="center"
        bg="bg.subtle"
      >
        <Text fontWeight="medium" color="fg.default">
          Сообщения ({messages.length})
        </Text>
        <HStack gap={2}>
          {isConnected ? (
            <HStack color="green.500" fontSize="xs">
              <LuWifi size={14} />
              <Text>Live</Text>
            </HStack>
          ) : (
            <HStack color="fg.muted" fontSize="xs">
              <LuWifiOff size={14} />
              <Text>Offline</Text>
            </HStack>
          )}
        </HStack>
      </Flex>

      {/* Messages */}
      <Box flex={1} overflowY="auto" p={4}>
        {isLoading ? (
          <Flex justify="center" align="center" h="100%">
            <Spinner />
          </Flex>
        ) : messages.length === 0 ? (
          <Flex justify="center" align="center" h="100%">
            <Text color="fg.muted" fontSize="sm">
              Нет сообщений. Начните диалог!
            </Text>
          </Flex>
        ) : (
          <VStack gap={3} align="stretch">
            {messages.map((msg, index) => {
              const isOwn = msg.sender.id === user?.id;
              const senderConf = senderTypeConfig[msg.senderType];
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);

              return (
                <Box key={msg.id}>
                  {showDate && (
                    <Flex justify="center" mb={2}>
                      <Text fontSize="xs" color="fg.muted" bg="bg.subtle" px={2} py={0.5} borderRadius="full">
                        {formatDate(msg.createdAt)}
                      </Text>
                    </Flex>
                  )}
                  <Flex
                    justify={isOwn ? 'flex-end' : 'flex-start'}
                    gap={2}
                  >
                    {!isOwn && (
                      <Avatar.Root size="sm">
                        <Avatar.Fallback>
                          {getInitials(msg.sender.fio, msg.sender.username)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    )}
                    <Box
                      maxW="70%"
                      bg={isOwn ? 'gray.900' : 'bg.subtle'}
                      color={isOwn ? 'white' : 'fg.default'}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderTopRightRadius={isOwn ? 'sm' : 'lg'}
                      borderTopLeftRadius={isOwn ? 'lg' : 'sm'}
                    >
                      {!isOwn && (
                        <HStack mb={1} gap={2}>
                          <Text fontSize="xs" fontWeight="medium">
                            {msg.sender.fio || msg.sender.username}
                          </Text>
                          {msg.senderType !== 'USER' && (
                            <Badge size="sm" colorPalette={senderConf.color} variant="subtle">
                              {senderConf.label}
                            </Badge>
                          )}
                        </HStack>
                      )}
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {msg.content}
                      </Text>
                      <Flex justify="flex-end" mt={1}>
                        <Text fontSize="xs" opacity={0.7}>
                          {formatTime(msg.createdAt)}
                          {msg.edited && ' (изм.)'}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      {/* Input */}
      <Box p={3} borderTopWidth="1px" borderColor="border.default" bg="bg.subtle">
        <Flex gap={2} align="center">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            bg="bg.surface"
            borderColor="border.default"
            _focus={{ borderColor: 'gray.400' }}
            flex={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            loading={isSending}
            bg="gray.900"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            <LuSend />
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
