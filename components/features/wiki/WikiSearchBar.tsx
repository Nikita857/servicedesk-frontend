"use client";

import { memo, useState } from "react";
import { Box, Button, Flex, Input, Text, VStack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useWikiAutocomplete } from "@/lib/hooks/wiki/useWikiAutocomplete";

interface WikiSearchBarProps {
  /** Вызывается только при отправке формы (submit) — не при каждом символе */
  onSearch: (query: string) => void;
}

/**
 * Изолированный компонент поиска.
 * Хранит локальный стейт `value` — wiki/page.tsx не ре-рендерится при печати.
 * Автодополнение (hint) живёт здесь же — не поднимается выше.
 */
export const WikiSearchBar = memo(function WikiSearchBar({
  onSearch,
}: WikiSearchBarProps) {
  const [value, setValue] = useState("");
  const { hint } = useWikiAutocomplete(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && hint) {
      const isAtEnd = e.currentTarget.selectionStart === value.length;
      if (e.key === "Tab" || isAtEnd) {
        e.preventDefault();
        setValue(hint);
      }
    }
  };

  return (
    <Box mb={6} data-onboarding-id="wiki-search">
      <form onSubmit={handleSubmit}>
        <VStack align="stretch" gap={2}>
          <Box position="relative">
            {/* Ghost Hint Layer */}
            {hint && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                px="calc(12px + 1px)"
                py="calc(8px + 1px)"
                pointerEvents="none"
                fontSize="md"
                fontFamily="inherit"
                color="fg.muted"
                opacity={0.5}
                whiteSpace="pre"
                overflow="hidden"
                zIndex={0}
              >
                <Box as="span" opacity={0}>
                  {value}
                </Box>
                {hint.slice(value.length)}
              </Box>
            )}

            <Flex gap={2}>
              <Input
                placeholder="Поиск по статьям..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                bg="transparent"
                flex={1}
                autoComplete="off"
                zIndex={1}
                _placeholder={{ color: "fg.muted", opacity: 0.6 }}
              />
              <Button type="submit" variant="outline">
                <LuSearch />
                Найти
              </Button>
            </Flex>
          </Box>
          <Text fontSize="xs" color="fg.muted" ml={1}>
            Поиск выполняется по всей базе знаний (включая другие отделы)
          </Text>
        </VStack>
      </form>
    </Box>
  );
});
