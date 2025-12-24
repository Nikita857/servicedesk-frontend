"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { messageApi } from "@/lib/api/messages";
import { useWebSocket } from "@/lib/providers";
import type { Message, MessageAttachment } from "@/types/message";
import type { SenderType } from "@/types/message";
import type { ChatMessageWS, TypingIndicator, AttachmentWS } from "@/types/websocket";

interface TypingUser {
  fio: string | null;
  username: string;
}

interface UseChatWebSocketReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  isConnected: boolean;
  typingUser: TypingUser | null;
  sendTypingIndicator: (typing: boolean) => void;
  sendMessage: (content: string, internal?: boolean) => boolean;
  fetchMessages: () => Promise<void>;
}

/**
 * Hook для управления чатом тикета через WebSocket
 * Использует централизованный WebSocketProvider
 */
export function useChatWebSocket(ticketId: number): UseChatWebSocketReturn {
  const { user } = useAuthStore();
  const {
    isConnected,
    subscribeToChatMessages,
    subscribeToInternalComments,
    subscribeToTyping,
    subscribeToAttachments,
    sendMessage: wsSendMessage,
    sendTyping,
  } = useWebSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Buffer for attachments that arrive before their messages
  const pendingAttachmentsRef = useRef<Map<number, MessageAttachment[]>>(new Map());
  // Store timeouts for cleaning up orphaned attachments
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastTypingSentRef = useRef<number>(0);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageApi.list(ticketId, 0, 100);
      setMessages(response.content.reverse());
      await messageApi.markAsRead(ticketId);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  // Send typing indicator (debounced)
  const sendTypingIndicator = useCallback(
    (typing: boolean) => {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 1000 || !typing) {
        sendTyping(ticketId, typing);
        lastTypingSentRef.current = now;
      }
    },
    [ticketId, sendTyping]
  );

  // Send message via WebSocket
  const sendMessage = useCallback(
    (content: string, internal = false): boolean => {
      return wsSendMessage(ticketId, content, internal);
    },
    [ticketId, wsSendMessage]
  );

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle incoming message (both regular and internal)
  const handleIncomingMessage = useCallback((wsMessage: ChatMessageWS) => {
    console.log("[WS] Incoming message payload:", wsMessage);
    
    // Construct sender if missing (flat structure vs nested)
    const sender = wsMessage.sender || {
      id: wsMessage.senderId!,
      username: wsMessage.senderUsername || "unknown",
      fio: wsMessage.senderFio || null,
    };

    // Helper to convert WS attachment to MessageAttachment
    const convertWsAttachments = (
      wsAttachments?: AttachmentWS[]
    ): MessageAttachment[] | undefined => {
      if (!wsAttachments || wsAttachments.length === 0) return undefined;
      return wsAttachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        type: att.type,
      }));
    };

    const newMsg: Message = {
      id: wsMessage.id,
      ticketId: wsMessage.ticketId,
      content: wsMessage.content,
      sender: sender,
      senderType: wsMessage.senderType as SenderType,
      internal: wsMessage.internal,
      readByUser: false,
      readBySpecialist: false,
      edited: false,
      createdAt: wsMessage.createdAt,
      updatedAt: wsMessage.createdAt,
      attachments: convertWsAttachments(wsMessage.attachments),
    };

    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === newMsg.id);

      // If message already exists, update it (e.g. attachments might have arrived)
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existingMsg = updated[existingIndex];
        
        // Merge attachments: use new ones if present, otherwise keep existing
        // Check if newMsg has more attachments than existingMsg
        const newAttachments = newMsg.attachments;
        const existingAttachments = existingMsg.attachments;
        
        // If we have new attachments in the payload, use them.
        // If the payload has NO attachments, but we have some locally (e.g. from optimistic update), keep local ones?
        // Risk: what if backend sends 0 attachments (update cleared them)?
        // But usually WS event with 0 attachments simply means "no change" to attachments if it's a content update.
        // However, if it's an "Attachment Added" event disguised as "Message Update", it will have them.
        
        // Strategy: If incoming message has attachments, overwrite. 
        // If incoming has none, keep existing (to preserve optimistic updates potentially).
        // But if it's a REAL update clearing attachments, this is wrong. 
        // Given MinIO flow, attachments are additive usually.
        
        if (newAttachments && newAttachments.length > 0) {
            updated[existingIndex] = { ...existingMsg, ...newMsg, attachments: newAttachments };
        } else {
            // Keep existing attachments if incoming has none
            updated[existingIndex] = { ...existingMsg, ...newMsg, attachments: existingAttachments || [] };
        }
        
        return updated;
      }

      // Check if there are pending attachments for this NEW message
      const pendingAttachments = pendingAttachmentsRef.current.get(newMsg.id);
      if (pendingAttachments) {
        newMsg.attachments = [...(newMsg.attachments || []), ...pendingAttachments];
        pendingAttachmentsRef.current.delete(newMsg.id);
        
        // Clear cleanup timeout
        const timeoutId = pendingTimeoutsRef.current.get(newMsg.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingTimeoutsRef.current.delete(newMsg.id);
        }
      }

      return [...prev, newMsg];
    });
  }, []);

  // Subscribe to chat messages and internal comments
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeMessages = subscribeToChatMessages(ticketId, handleIncomingMessage);
    const unsubscribeInternal = subscribeToInternalComments(ticketId, handleIncomingMessage);

    return () => {
      unsubscribeMessages();
      unsubscribeInternal();
    };
  }, [isConnected, ticketId, subscribeToChatMessages, subscribeToInternalComments, handleIncomingMessage]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToTyping(ticketId, (indicator: TypingIndicator) => {
      if (indicator.userId === user?.id) return;

      if (indicator.typing) {
        setTypingUser({ fio: indicator.fio, username: indicator.username });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    return unsubscribe;
  }, [isConnected, ticketId, subscribeToTyping, user?.id]);

  // Subscribe to attachments
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToAttachments(ticketId, (attachment: AttachmentWS) => {
      console.log("[WS] Attachment event received:", attachment);
      
      // Convert AttachmentWS to MessageAttachment
      const newAttachment: MessageAttachment = {
        id: attachment.id,
        filename: attachment.filename,
        url: attachment.url,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        type: attachment.type,
      };

      const messageId = attachment.messageId;
      if (messageId !== null && messageId !== undefined) {
        setMessages((prev) => {
          const messageExists = prev.some((m) => m.id === messageId);

          if (!messageExists) {
            console.log(`[WS] Message ${messageId} for attachment not found locally. Buffer it.`);
            // Message hasn't arrived yet, buffer the attachment
            const existing = pendingAttachmentsRef.current.get(messageId) || [];
            pendingAttachmentsRef.current.set(messageId, [...existing, newAttachment]);

            // Set cleanup timeout (60 seconds) to avoid memory leaks
            // If message doesn't arrive in 60s, discard these attachments
            if (!pendingTimeoutsRef.current.has(messageId)) {
              const timeoutId = setTimeout(() => {
                pendingAttachmentsRef.current.delete(messageId);
                pendingTimeoutsRef.current.delete(messageId);
                console.warn(`Cleaned up orphaned attachments for message ${messageId}`);
              }, 60000);
              pendingTimeoutsRef.current.set(messageId, timeoutId);
            }
            
            return prev;
          }

          console.log(`[WS] Message ${messageId} found. Updating with attachment.`);
          return prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  attachments: [...(msg.attachments || []), newAttachment],
                }
              : msg
          );
        });
        
        // Force refresh messages to ensure consistency (failsafe)
        // Add distinct delay to allow backend transaction to commit
        setTimeout(() => {
            console.log("[WS] Force fetching messages after attachment event");
            fetchMessages();
        }, 1000);
      }
    });

    return unsubscribe;
  }, [isConnected, ticketId, subscribeToAttachments]);

  return {
    messages,
    setMessages,
    isLoading,
    isConnected,
    typingUser,
    sendTypingIndicator,
    sendMessage,
    fetchMessages,
  };
}
