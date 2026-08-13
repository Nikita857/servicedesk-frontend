"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuArrowUp,
  LuFileText,
  LuPaperclip,
  LuSquare,
  LuX,
} from "react-icons/lu";
import { useAgentDensity } from "./agentDensity";
import { toast } from "@/lib/utils";
import { Tooltip } from "@/components/ui";

interface AgentChatInputProps {
  onSend: (text: string, files: File[]) => void;
  onStop: () => void;
  isLoading: boolean;
}

/** Потолок авто-роста поля: дальше внутри появляется свой скролл. */
const FIELD_MAX_HEIGHT = 140;

/*
 * Ограничения дублируют серверные (AgentProperties.Files): бэкенд всё равно проверит
 * сам, но сказать «этот формат не подойдёт» до заливки 20 МБ по сети — вежливее.
 * .doc/.xls не поддерживаются: их не читают ни python-docx, ни openpyxl.
 */
const ALLOWED_EXTENSIONS = [".docx", ".xlsx", ".pptx", ".pdf"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILES = 3;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function rejectionReason(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return `«${file.name}» — поддерживаются только ${ALLOWED_EXTENSIONS.join(" и ")}. Старые .doc и .xls пересохраните в Word или Excel.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `«${file.name}» слишком большой: ${formatSize(file.size)} при пределе ${formatSize(MAX_FILE_SIZE_BYTES)}.`;
  }
  return null;
}

/**
 * Поле ввода чата — общее для виджета и страницы, размеры берёт из density.
 *
 * Текст живёт здесь, а не в useAgentChat: наружу уходит только готовая строка.
 * Так набор символов не дёргает ре-рендером список сообщений. Выбранные бланки —
 * тоже здесь: на бэк они уезжают уже в момент отправки, вместе с сообщением.
 */
export function AgentChatInput({
  onSend,
  onStop,
  isLoading,
}: AgentChatInputProps) {
  const d = useAgentDensity();
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  // Счётчик, а не флаг: dragleave прилетает и при переходе на дочерний элемент,
  // и рамка мигала бы на каждом движении мыши внутри формы.
  const dragDepth = useRef(0);

  // Зависимость от value, а не обработчик onChange: так высота сбрасывается
  // и после отправки, когда поле чистится программно
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, FIELD_MAX_HEIGHT)}px`;
  }, [value]);

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;

    const accepted: File[] = [];
    for (const file of incoming) {
      const reason = rejectionReason(file);
      if (reason) {
        toast.error("Файл не подходит", reason);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setFiles((prev) => {
      // Повторный выбор того же файла — не ошибка, просто ничего не добавляем
      const merged = [...prev];
      for (const file of accepted) {
        const isDuplicate = merged.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size,
        );
        if (!isDuplicate) merged.push(file);
      }
      if (merged.length > MAX_FILES) {
        toast.error(
          "Слишком много файлов",
          `К одному сообщению можно приложить не больше ${MAX_FILES}.`,
        );
      }
      return merged.slice(0, MAX_FILES);
    });
  };

  const submit = () => {
    const text = value.trim();
    if (!text || isLoading) return;
    setValue("");
    setFiles([]);
    onSend(text, files);
  };

  return (
    <Box
      as="form"
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        submit();
      }}
      onDragEnter={(event: React.DragEvent) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        dragDepth.current += 1;
        setIsDragOver(true);
      }}
      onDragOver={(event: React.DragEvent) => {
        // Без preventDefault браузер откроет файл в соседней вкладке вместо drop
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDragOver(false);
      }}
      onDrop={(event: React.DragEvent) => {
        event.preventDefault();
        dragDepth.current = 0;
        setIsDragOver(false);
        addFiles(Array.from(event.dataTransfer.files));
      }}
      position="relative"
      mx={d.gutter}
      mb={d.gutter}
      px={3}
      py={2.5}
      borderWidth="1px"
      borderColor={isDragOver ? "fg.default" : "border.emphasized"}
      borderRadius="14px"
      bg={isDragOver ? "bg.subtle" : "bg.canvas"}
      transition="border-color 0.15s ease"
      _focusWithin={{ borderColor: "fg.default" }}
    >
      {files.length > 0 && (
        <Flex direction="column" gap={1.5} mb={2.5}>
          {files.map((file) => (
            <HStack
              key={`${file.name}-${file.size}`}
              gap={2}
              px={2.5}
              py={1.5}
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="10px"
              bg="bg.subtle"
            >
              <Box color="fg.muted" display="flex" flexShrink={0}>
                <LuFileText size={14} />
              </Box>
              <Text
                fontSize={d.caption}
                color="fg.default"
                flex={1}
                minW={0}
                truncate
                title={file.name}
              >
                {file.name}
              </Text>
              <Text fontSize={d.caption} color="fg.muted" flexShrink={0}>
                {formatSize(file.size)}
              </Text>
              <IconButton
                aria-label={`Убрать ${file.name}`}
                variant="ghost"
                color="fg.subtle"
                w="20px"
                h="20px"
                minW="20px"
                p={0}
                borderRadius="6px"
                onClick={() =>
                  setFiles((prev) => prev.filter((item) => item !== file))
                }
              >
                <LuX size={12} />
              </IconButton>
            </HStack>
          ))}
        </Flex>
      )}

      <Textarea
        ref={fieldRef}
        rows={1}
        value={value}
        placeholder={
          isDragOver ? "Отпустите файл здесь" : "Спросите ИИ-агента…"
        }
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Enter отправляет, Shift+Enter переносит строку.
          // isComposing — защита от IME: там Enter подтверждает набор иероглифа
          if (event.key === "Enter" && !event.shiftKey && !isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        spellCheck={false}
        resize="none"
        border="none"
        borderRadius={0}
        px={0}
        py={0}
        minH="auto"
        maxH={`${FIELD_MAX_HEIGHT}px`}
        overflowY="auto"
        fontSize={d.body}
        lineHeight="1.5"
        _focus={{ boxShadow: "none", outline: "none" }}
        _focusVisible={{ boxShadow: "none", outline: "none" }}
      />

      <Flex align="center" justify="space-between" mt={2.5}>
        <input
          ref={pickerRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          multiple
          hidden
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            // Сброс значения: иначе повторный выбор того же файла не даёт события
            event.target.value = "";
          }}
        />

        <Tooltip content="Приложить бланк .docx или .xlsx">
          <IconButton
            type="button"
            aria-label="Приложить бланк Word или Excel"
            variant="ghost"
            w={d.iconButton}
            h={d.iconButton}
            minW={d.iconButton}
            p={0}
            borderRadius="8px"
            bg="bg.subtle"
            color="fg.muted"
            _hover={{ color: "fg.default", bg: "bg.muted" }}
            disabled={isLoading || files.length >= MAX_FILES}
            onClick={() => pickerRef.current?.click()}
          >
            <LuPaperclip />
          </IconButton>
        </Tooltip>

        {/*
          Одна кнопка на два состояния: во время генерации она останавливает поток.
          Так у пользователя нет выбора между «отправить» и «стоп» одновременно —
          отправлять всё равно нельзя, пока идёт ответ.
        */}
        <IconButton
          type={isLoading ? "button" : "submit"}
          aria-label={isLoading ? "Остановить генерацию" : "Отправить"}
          onClick={isLoading ? onStop : undefined}
          disabled={!isLoading && !value.trim()}
          w={d.sendButton}
          h={d.sendButton}
          minW={d.sendButton}
          p={0}
          borderRadius="10px"
          bg="fg.default"
          color="bg.surface"
          _hover={{ bg: "gray.700", _dark: { bg: "gray.300" } }}
        >
          {isLoading ? (
            <LuSquare size={12} fill="currentColor" />
          ) : (
            <LuArrowUp />
          )}
        </IconButton>
      </Flex>
    </Box>
  );
}
