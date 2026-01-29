"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton, HStack, Spinner, Text } from "@chakra-ui/react";
import {
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuQuote,
  LuImage,
  LuLink,
  LuUndo,
  LuRedo,
  LuMinus,
  LuVideo,
  LuYoutube,
} from "react-icons/lu";
import { wikiImageApi } from "@/lib/api/wikiImages";
import { wikiVideoApi } from "@/lib/api/wikiVideos";
import { handleApiError, toast } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Video } from "./VideoExtension";
import "./wiki-editor.css";

interface WikiEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={tooltip}>
      <IconButton
        size="sm"
        variant={isActive ? "solid" : "ghost"}
        onClick={onClick}
        disabled={disabled}
        bg={isActive ? "gray.200" : undefined}
        _dark={{ bg: isActive ? "gray.700" : undefined }}
        aria-label={tooltip}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

// Toolbar Component
function EditorToolbar({
  editor,
  onImageUpload,
  onVideoUpload,
  isUploading,
}: {
  editor: Editor | null;
  onImageUpload: () => void;
  onVideoUpload: () => void;
  isUploading: boolean;
}) {
  if (!editor) return null;

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL ссылки:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = window.prompt("Введите URL видео с YouTube:");

    if (url === null) return;

    if (url === "") {
      return;
    }

    editor.commands.setYoutubeVideo({
      src: url,
      width: 640,
      height: 480,
    });
  }, [editor]);

  return (
    <Flex
      borderBottomWidth="1px"
      borderColor="border.default"
      p={2}
      gap={1}
      flexWrap="wrap"
      bg="bg.subtle"
      borderTopRadius="md"
    >
      {/* Text formatting */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tooltip="Жирный (Ctrl+B)"
        >
          <LuBold />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tooltip="Курсив (Ctrl+I)"
        >
          <LuItalic />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          tooltip="Зачёркнутый"
        >
          <LuStrikethrough />
        </ToolbarButton>
      </HStack>

      <Box w="1px" bg="border.default" mx={1} />

      {/* Headings */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          tooltip="Заголовок 1"
        >
          <LuHeading1 />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          tooltip="Заголовок 2"
        >
          <LuHeading2 />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          tooltip="Заголовок 3"
        >
          <LuHeading3 />
        </ToolbarButton>
      </HStack>

      <Box w="1px" bg="border.default" mx={1} />

      {/* Lists */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="Маркированный список"
        >
          <LuList />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="Нумерованный список"
        >
          <LuListOrdered />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          tooltip="Цитата"
        >
          <LuQuote />
        </ToolbarButton>
      </HStack>

      <Box w="1px" bg="border.default" mx={1} />

      {/* Links and Media */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive("link")}
          tooltip="Вставить ссылку"
        >
          <LuLink />
        </ToolbarButton>
        <ToolbarButton
          onClick={onImageUpload}
          disabled={isUploading}
          tooltip="Вставить изображение"
        >
          {isUploading ? <Spinner size="sm" /> : <LuImage />}
        </ToolbarButton>
        <ToolbarButton
          onClick={onVideoUpload}
          disabled={isUploading}
          tooltip="Вставить видео"
        >
          {isUploading ? <Spinner size="sm" /> : <LuVideo />}
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} tooltip="Вставить YouTube">
          <LuYoutube />
        </ToolbarButton>
      </HStack>

      <Box w="1px" bg="border.default" mx={1} />

      {/* Misc */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="Горизонтальная линия"
        >
          <LuMinus />
        </ToolbarButton>
      </HStack>

      <Box flex={1} />

      {/* Undo/Redo */}
      <HStack gap={0}>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Отменить (Ctrl+Z)"
        >
          <LuUndo />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Повторить (Ctrl+Y)"
        >
          <LuRedo />
        </ToolbarButton>
      </HStack>
    </Flex>
  );
}

export default function WikiEditor({
  value,
  onChange,
  placeholder = "Начните писать статью...",
  height = "500px",
}: WikiEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isUploading = useRef(false);
  const [uploadingState, setUploadingState] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    const currentEditor = editorRef.current;
    if (!currentEditor || isUploading.current) return;

    isUploading.current = true;
    setUploadingState(true);

    try {
      const response = await wikiImageApi.uploadImage(file);
      currentEditor.chain().focus().setImage({ src: response.url }).run();
      toast.success("Изображение загружено");
    } catch (error) {
      console.error("Image upload failed:", error);
      handleApiError(error, { context: "Ошибка загрузки изображения" });
    } finally {
      isUploading.current = false;
      setUploadingState(false);
    }
  }, []);

  const uploadVideo = useCallback(async (file: File) => {
    const currentEditor = editorRef.current;
    if (!currentEditor || isUploading.current) return;

    isUploading.current = true;
    setUploadingState(true);

    try {
      const response = await wikiVideoApi.uploadVideo(file);
      currentEditor.chain().focus().setVideo({ src: response.url }).run();
      toast.success("Видео загружено");
    } catch (error) {
      console.error("Video upload failed:", error);
      handleApiError(error, { context: "Ошибка загрузки видео" });
    } finally {
      isUploading.current = false;
      setUploadingState(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "wiki-editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "wiki-editor-link",
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: "wiki-editor-youtube",
        },
      }),
      Video.configure({
        HTMLAttributes: {
          class: "wiki-editor-video",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: (() => {
      if (!value) return "";
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    })(),
    onCreate({ editor }) {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class: "wiki-editor-content",
        style: `min-height: 100%`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter((file) => file.type.startsWith("image/"));
          const videos = files.filter((file) => file.type.startsWith("video/"));
          if (images.length > 0) {
            event.preventDefault();
            images.forEach((image) => uploadImage(image));
            return true;
          }
          if (videos.length > 0) {
            event.preventDefault();
            videos.forEach((video) => uploadVideo(video));
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                uploadImage(file);
              }
              return true;
            }
            if (item.type.startsWith("video/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                uploadVideo(file);
              }
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (value !== currentContent) {
        try {
          const parsed = JSON.parse(value);
          editor.commands.setContent(parsed);
        } catch {
          editor.commands.setContent(value);
        }
      }
    }
  }, [editor, value]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleVideoButtonClick = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        uploadImage(files[0]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadImage],
  );

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        uploadVideo(files[0]);
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    },
    [uploadVideo],
  );

  return (
    <Box
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="md"
      overflow="hidden"
      bg="bg.surface"
    >
      <EditorToolbar
        editor={editor}
        onImageUpload={handleImageButtonClick}
        onVideoUpload={handleVideoButtonClick}
        isUploading={uploadingState}
      />
      <Box height={height} overflowY="auto" position="relative">
        <EditorContent editor={editor} style={{ height: "100%" }} />
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        style={{ display: "none" }}
      />

      {uploadingState && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.50"
          align="center"
          justify="center"
          zIndex={10}
        >
          <HStack bg="bg.surface" p={4} borderRadius="md" shadow="md">
            <Spinner size="sm" />
            <Text>Загрузка медиа...</Text>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
