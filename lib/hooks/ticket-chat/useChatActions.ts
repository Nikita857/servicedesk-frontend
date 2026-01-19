import { useState, useRef } from "react";
import axios from "axios";
import { messageApi } from "@/lib/api/messages";
import { useFileUpload } from "@/lib/hooks";
import { handleApiError, toast, validateFile } from "@/lib/utils";
import type { Message } from "@/types/message";

interface UseChatActionsReturn {
  newMessage: string;
  setNewMessage: (value: string) => void;
  selectedFile: File | null;
  isUploading: boolean;
  isSending: boolean;
  editingMessage: Message | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasteFile: (file: File) => void;
  handleRemoveFile: () => void;
  handleEditMessage: (msg: Message) => void;
  handleDeleteMessage: (msgId: number) => Promise<void>;
  sendMessage: (content: string, file: File | null) => Promise<void>;
}

export const useChatActions = (
  ticketId: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  wsSendMessage: (content: string) => boolean,
  isConnected: boolean,
): UseChatActionsReturn => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload } = useFileUpload();

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error("Ошибка", error);
      return;
    }
    setSelectedFile(file);
  };

  // Обработка вставки файла из буфера обмена
  const handlePasteFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error("Ошибка", error);
      return;
    }
    setSelectedFile(file);
    toast.info("Изображение", `Добавлено: ${file.name}`);
  };

  // Удаление выбранного файла
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Установка сообщения для редактирования
  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
  };

  // Удаление сообщения
  const handleDeleteMessage = async (msgId: number) => {
    try {
      await messageApi.delete(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success("Сообщение удалено");
    } catch (error) {
      toast.error("Ошибка", "Не удалось удалить сообщение");
    }
  };

  // Основная логика отправки сообщения
  const sendMessage = async (content: string, file: File | null) => {
    if (!content.trim() && !file) return;

    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Режим редактирования
    if (editingMessage) {
      try {
        const updatedMessage = await messageApi.edit(editingMessage.id, {
          content,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? updatedMessage : m)),
        );
        toast.success("Сообщение обновлено");
      } catch (error) {
        toast.error("Ошибка", "Не удалось обновить сообщение");
        setNewMessage(content);
      } finally {
        setEditingMessage(null);
      }
      return;
    }

    // Если есть файл, отправляем его через HTTP API + MinIO
    if (file) {
      setIsUploading(true);
      let messageId: number | null = null;

      try {
        // 1. Создаем сообщение (с текстом или плейсхолдером)
        const messageContent = content || `📎 ${file.name}`;
        const message = await messageApi.send(ticketId, {
          content: messageContent,
        });
        messageId = message.id;

        // Оптимистичное добавление сообщения в чат
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev.map((m) => (m.id === message.id ? message : m));
          }
          return [...prev, message];
        });

        // 2. Загружаем файл в MinIO и привязываем к сообщению
        const result = await upload(file, "MESSAGE", message.id);

        if (!result) {
          throw new Error("Upload failed");
        }

        // 3. Оптимистично обновляем сообщение, добавляя вложение
        // Это убирает визуальную задержку до получения события WebSocket
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.id === message.id) {
              return {
                ...m,
                attachments: [...(m.attachments || []), result],
              };
            }
            return m;
          });
        });
      } catch (error) {
        // Откат: удаляем сообщение, если не удалось загрузить файл
        if (messageId) {
          try {
            await messageApi.delete(messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            console.log("Rolled back message due to upload failure");
          } catch (rollbackError) {
            console.error("Failed to rollback message", rollbackError);
          }
        }

        if (error instanceof Error && error.message === "Upload failed") {
          // Ошибка уже обработана в хуке useFileUpload
        } else if (axios.isAxiosError(error) && error.response) {
          handleApiError(error, { context: "Отправить файл" });
        } else {
          toast.error("Ошибка", "Не удалось отправить файл");
        }
      } finally {
        setIsUploading(false);
      }
    }
    // Если только текст, пробуем через WebSocket
    else if (content) {
      if (isConnected && wsSendMessage(content)) return;

      // Фолбэк на HTTP API, если WS недоступен
      setIsSending(true);
      try {
        const message = await messageApi.send(ticketId, { content });
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev.map((m) => (m.id === message.id ? message : m));
          }
          return [...prev, message];
        });
      } catch (error) {
        handleApiError(error, { context: "Отправить сообщение" });
        setNewMessage(content);
      } finally {
        setIsSending(false);
      }
    }
  };

  return {
    newMessage,
    setNewMessage,
    selectedFile,
    isUploading,
    isSending,
    editingMessage,
    fileInputRef,
    handleFileSelect,
    handlePasteFile,
    handleRemoveFile,
    handleEditMessage,
    handleDeleteMessage,
    sendMessage,
  };
};
