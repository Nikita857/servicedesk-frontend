import { useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useColorMode } from "@/components/ui/color-mode";
import { Box, IconButton } from "@chakra-ui/react";
import { LuSmile } from "react-icons/lu";

export function CustomEmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { colorMode } = useColorMode();

  return (
    <Box position="relative">
      <IconButton
        aria-label="Emoji"
        variant="ghost"
        onClick={() => setIsOpen((v) => !v)}
      >
        <LuSmile />
      </IconButton>

      {isOpen && (
        <Box position="absolute" bottom="40px" zIndex={10}>
          <EmojiPicker
            theme={colorMode === "dark" ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(e) => {
              onSelect(e.emoji);
              setIsOpen(false);
            }}
            searchDisabled={false}
            skinTonesDisabled
            lazyLoadEmojis
          />
        </Box>
      )}
    </Box>
  );
}
