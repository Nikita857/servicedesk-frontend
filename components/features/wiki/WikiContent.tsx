"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { Video } from "./VideoExtension";
import { useState, useEffect, useCallback } from "react";
import { Box } from "@chakra-ui/react";
import { ImageLightbox } from "@/components/ui";
import "./wiki-editor.css";

interface WikiContentProps {
  content: string;
}

/**
 * Read-only renderer for wiki article content.
 * Supports both TipTap JSON format and legacy plain text/HTML.
 * Includes lightbox for image viewing.
 */
export default function WikiContent({ content }: WikiContentProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Determine content type and parse
  const getContent = useCallback(() => {
    if (!content) return "";
    try {
      // Try to parse as JSON (TipTap format)
      return JSON.parse(content);
    } catch {
      // Fallback: treat as plain text/HTML
      return content;
    }
  }, [content]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: "wiki-editor-image wiki-image-clickable",
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "wiki-editor-link",
          target: "_blank",
          rel: "noopener noreferrer",
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
    ],
    content: getContent(),
    editable: false,
    editorProps: {
      attributes: {
        class: "wiki-editor-content",
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      const parsedContent = getContent();
      const currentContent = editor.getJSON();

      // Only update if content is different
      if (JSON.stringify(parsedContent) !== JSON.stringify(currentContent)) {
        editor.commands.setContent(parsedContent);
      }
    }
  }, [editor, content, getContent]);

  // Handle image clicks for lightbox
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" &&
        target.classList.contains("wiki-image-clickable")
      ) {
        const src = (target as HTMLImageElement).src;
        setLightboxImage(src);
      }
    };

    document.addEventListener("click", handleImageClick);
    return () => document.removeEventListener("click", handleImageClick);
  }, []);

  return (
    <>
      <Box className="wiki-content-viewer">
        <EditorContent editor={editor} />
      </Box>

      <ImageLightbox
        src={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
}
