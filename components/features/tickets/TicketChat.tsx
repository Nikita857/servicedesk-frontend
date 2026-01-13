import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { LuWifi, LuWifiOff, LuPaperclip, LuX } from "react-icons/lu";
import { useState } from "react";
import { useAuthStore } from "@/stores";
import type { TicketStatus } from "@/types";
import { useChatWebSocket } from "@/lib/hooks/useChatWebSocket";
import { ChatMessageList } from "../ticket-chat/ChatMessageList";
import ChatInput from "../ticket-chat/ChatInput";
import { useChatActions } from "@/lib/hooks";
import { formatFileSize } from "@/lib/utils";

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
    editingMessage,
    fileInputRef,
    handleFileSelect,
    handleRemoveFile,
    handleEditMessage,
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
          <ChatMessageList
            messages={messages}
            currentUserId={user?.id}
            isLoading={isLoading}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onImageClick={setLightboxImage}
          />
        </Box>

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
            <Flex px={3} py={1} align="center" gap={2}>
              <Box className="typing-dots" display="flex" gap={1}>
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite"
                />
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite 0.2s"
                />
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="blue.500"
                  animation="pulse 1.4s infinite 0.4s"
                />
              </Box>
              <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                {typingUser.fio || typingUser.username} печатает...
              </Text>
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
              isEditing={!!editingMessage}
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
              isEditing={!!editingMessage}
            />
          )}
        </Box>
      </Box>

      {/* Image Lightbox */}
      <Dialog.Root
        open={!!lightboxImage}
        onOpenChange={(details) => !details.open && setLightboxImage(null)}
        size="cover"
      >
        <Portal>
          <Dialog.Backdrop
            bg="blackAlpha.800"
            onClick={() => setLightboxImage(null)}
          />
          <Dialog.Positioner>
            <Dialog.Content
              bg="transparent"
              shadow="none"
              maxW="95vw"
              maxH="95vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setLightboxImage(null)}
            >
              <CloseButton
                position="absolute"
                top={4}
                right={4}
                color="white"
                size="lg"
                onClick={() => setLightboxImage(null)}
                zIndex={10}
                _hover={{ bg: "whiteAlpha.200" }}
              />
              {lightboxImage && (
                <img
                  src={lightboxImage}
                  alt="Enlarged view"
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  );
}
