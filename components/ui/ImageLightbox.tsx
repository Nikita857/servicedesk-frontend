"use client";

import {Box, Button, CloseButton, Dialog, HStack, Portal,} from "@chakra-ui/react";
import {LuDownload} from "react-icons/lu";

interface ImageLightboxProps {
    /** URL картинки. null/undefined — лайтбокс закрыт. */
    src: string | null;
    /** Колбэк закрытия. */
    onClose: () => void;
    /** Показывать кнопку скачивания. */
    downloadable?: boolean;
    /** alt-текст для изображения. */
    alt?: string;
}

/**
 * Модалка для просмотра изображения в полном размере.
 * Контейнер обнимает картинку (fit-content) — маленькие картинки
 * не раздуваются до экрана, большие вписываются в `100dvh`/`100vw`.
 */
export function ImageLightbox({
                                  src,
                                  onClose,
                                  downloadable = false,
                                  alt = "Просмотр изображения",
                              }: ImageLightboxProps) {
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!src) return;

        // Пытаемся вытащить имя файла из URL, иначе — дефолтное с timestamp.
        let filename = `image-${Date.now()}`;
        try {
            const url = new URL(src, window.location.href);
            const last = url.pathname.split("/").filter(Boolean).pop();
            if (last && last.includes(".")) {
                filename = decodeURIComponent(last);
            }
        } catch {
            // URL может быть относительным/blob — игнорируем, fallback уже выставлен
        }

        const link = document.createElement("a");
        link.href = src;
        link.download = filename;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog.Root
            open={!!src}
            onOpenChange={(d) => !d.open && onClose()}
            placement="center"
        >
            <Portal>
                <Dialog.Backdrop bg="blackAlpha.800" onClick={onClose}/>
                <Dialog.Positioner padding={{base: 3, md: 6}}>
                    <Dialog.Content
                        bg="transparent"
                        shadow="none"
                        w="fit-content"
                        h="fit-content"
                        maxW="calc(100vw - 1.5rem)"
                        maxH="calc(100dvh - 1.5rem)"
                        minW="0"
                        minH="0"
                        overflow="visible"
                        onClick={onClose}
                    >
                        <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            height="60px"
                            bgGradient="linear(to-b, blackAlpha.600, transparent)"
                            zIndex={9}
                            pointerEvents="none"
                        />
                        <HStack
                            position="absolute"
                            top={2}
                            right={2}
                            zIndex={10}
                            gap={1}
                            bg="blackAlpha.600"
                            borderRadius="md"
                            p={1}
                            backdropFilter="blur(4px)"
                        >
                            {downloadable && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="white"
                                    _hover={{bg: "whiteAlpha.300"}}
                                    onClick={handleDownload}
                                    aria-label="Скачать изображение"
                                >
                                    <LuDownload size={20}/>
                                </Button>
                            )}
                            <CloseButton
                                color="white"
                                size="lg"
                                _hover={{bg: "whiteAlpha.300"}}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                aria-label="Закрыть просмотр"
                            />
                        </HStack>

                        {src && (
                            <img
                                src={src}
                                alt={alt}
                                onClick={(e) => e.stopPropagation()}
                                decoding="async"
                                style={{
                                    display: "block",
                                    maxWidth: "calc(100vw - 1.5rem)",
                                    maxHeight: "calc(100dvh - 1.5rem)",
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain",
                                    borderRadius: 8,
                                }}
                            />
                        )}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
