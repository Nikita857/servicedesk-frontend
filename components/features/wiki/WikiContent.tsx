"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useState, useEffect, useCallback } from "react";
import { Box, Dialog, Portal, CloseButton } from "@chakra-ui/react";
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
    ],
    content: getContent(),
    editable: false,
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
    </>
  );
}
