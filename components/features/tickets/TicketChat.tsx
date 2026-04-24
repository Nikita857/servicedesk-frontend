import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Avatar,
  Badge,
} from "@chakra-ui/react";
import { LuPaperclip, LuX } from "react-icons/lu";
import { useState } from "react";
import { useAuthStore } from "@/stores";
import { userRolesBadges, type TicketStatus } from "@/types";
import { useChatWebSocket } from "@/lib/hooks/ticket-chat/useChatWebSocket";
import { ChatMessageList } from "../ticket-chat/ChatMessageList";
import ChatInput from "../ticket-chat/ChatInput";
import { useChatActions, useTicketQuery } from "@/lib/hooks";
import {
  formatFileSize,
  getFullNameInitials,
  getShortInitials,
} from "@/lib/utils";
import { ImageLightbox } from "@/components/ui";

interface TicketChatProps {
  ticketId: number;
  ticketStatus: TicketStatus;
  isCreator?: boolean; // Is current user the ticket creator
}

export function TicketChat({
  ticketId,
  ticketStatus,
  isCreator = false,
}: TicketChatProps) {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  //fetch ticket info

  const { ticket, currentAssignment } = useTicketQuery(ticketId);

  // Use custom hook for WebSocket and messages
  const {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
    sendMessage: wsSendMessage,
  } = useChatWebSocket(ticketId);

  // Use custom hook for handling chat actions (sending, editing, files)
  const {
    newMessage,
    setNewMessage,
    selectedFile,
    isUploading,
    isSending,
    fileInputRef,
    handleFileSelect,
    handlePasteFile,
    handleRemoveFile,
    handleDeleteMessage,
    sendMessage,
  } = useChatActions(ticketId, setMessages, wsSendMessage, isConnected);

  const handleSend = () => {
    sendMessage(newMessage, selectedFile);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    sendTypingIndicator(value.length > 0);
  };

  const handleSendWithTyping = () => {
    sendTypingIndicator(false);
    handleSend();
  };

  // Check if chat should be active
  // - CLOSED/CANCELLED: specialists can still send, creators cannot
  const isChatActive = (): boolean => {
    if (ticketStatus === "CLOSED") return false; // No one can send on closed
    if (ticketStatus === "CANCELLED") {
      // Specialists can send, but creators cannot
      return isSpecialist && !isCreator;
    }
    return true;
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Chat Box */}
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
          <HStack gap={3}>
            {/* Аватар собеседника */}
            <Avatar.Root size="sm" flexShrink={0}>
              <Avatar.Fallback>
                {ticket?.createdBy.id === user?.id
                  ? ticket?.assignedTo
                    ? getShortInitials(ticket.assignedTo.fio)
                    : `#${ticketId}`
                  : ticket?.createdBy
                    ? getShortInitials(ticket.createdBy.fio)
                    : `#${ticketId}`}
              </Avatar.Fallback>

              <Avatar.Image
                src={
                  ticket?.createdBy.id === user?.id
                    ? (ticket?.assignedTo?.avatarUrl ?? undefined)
                    : (ticket?.createdBy?.avatarUrl ?? undefined)
                }
              />
            </Avatar.Root>

            <Box>
              <Text fontWeight="semibold" fontSize="sm" color="fg.default">
                {ticket?.createdBy.id === user?.id
                  ? ticket?.assignedTo
                    ? getFullNameInitials(ticket.assignedTo.fio)
                    : `Чат заявки #${ticketId}`
                  : ticket?.createdBy
                    ? getFullNameInitials(ticket.createdBy.fio)
                    : `Чат заявки #${ticketId}`}
              </Text>

              {isConnected && ticket?.assignedTo ? (
                <HStack gap={1.5}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg="green.500" />
                  <Text fontSize="xs" color="green.500" fontWeight="medium">
                    онлайн
                  </Text>
                </HStack>
              ) : (
                <HStack gap={1.5}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg="fg.muted" />
                  <Text fontSize="xs" color="fg.muted">
                    офлайн
                  </Text>
                </HStack>
              )}
            </Box>
          </HStack>

          <Text fontSize="xs" color="fg.muted">
            {messages.length} сообщений
          </Text>
        </Flex>

        {/* Messages */}
        <Flex
          overflowY="auto"
          p={4}
          w="100%"
          justifyContent="center"
          alignItems="center"
        >
          <Box w="90%" maxW="900px">
            <ChatMessageList
              messages={messages}
              currentUserId={user?.id}
              isSpecialist={isSpecialist}
              isLoading={isLoading}
              onDeleteMessage={handleDeleteMessage}
              onImageClick={setLightboxImage}
            />
          </Box>
        </Flex>

        {/* Input Section */}
        <Box
          p={3}
          borderTopWidth="1px"
          borderColor="border.default"
          bg="bg.subtle"
        >
          {/* Selected File Preview */}
          {selectedFile && (
            <Flex
              mb={2}
              p={2}
              bg="bg.muted"
              borderRadius="md"
              align="center"
              gap={2}
            >
              <LuPaperclip size={14} />
              <Text fontSize="sm" flex={1} truncate>
                {selectedFile.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {formatFileSize(selectedFile.size)}
              </Text>
              <Button size="xs" variant="ghost" onClick={handleRemoveFile}>
                <LuX size={14} />
              </Button>
            </Flex>
          )}

          {/* Typing Indicator */}
          {typingUser && (
            <Flex px={4} py={2} align="center" gap={2}>
              <Text fontSize="xs" color="fg.subtle">
                {typingUser.fio || typingUser.username} печатает
              </Text>

              {/* Бабл с точками */}
              <Flex
                align="center"
                gap="5px"
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                borderRadius="12px 12px 12px 3px"
                px={3}
                py={2}
              >
                <style>{`
        @keyframes typingBlink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .typing-dot { animation: typingBlink 1.4s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    className="typing-dot"
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="fg.muted"
                  />
                ))}
              </Flex>
            </Flex>
          )}

          {/* Chat Input */}
          {isChatActive() ? (
            <ChatInput
              handleFileSelect={handleFileSelect}
              isUploading={isUploading}
              newMessage={newMessage}
              setNewMessage={handleInputChange}
              handleSend={handleSendWithTyping}
              fileInputRef={fileInputRef}
              isSending={isSending}
              selectedFile={selectedFile}
              isChatInactive={false}
              onPasteFile={handlePasteFile}
            />
          ) : (
            <ChatInput
              handleFileSelect={handleFileSelect}
              isUploading={isUploading}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSend={handleSend}
              fileInputRef={fileInputRef}
              isSending={isSending}
              selectedFile={selectedFile}
              isChatInactive={true}
            />
          )}
        </Box>
      </Box>

      <ImageLightbox
        src={lightboxImage}
        onClose={() => setLightboxImage(null)}
        downloadable
      />
    </VStack>
  );
}
