"use client";

import { memo, useState, useCallback } from "react";
import { Box, Button, Flex, Input, Text, VStack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useWikiAutocomplete } from "@/lib/hooks/wiki/useWikiAutocomplete";
import type { WikiArticleSuggestion } from "@/lib/api/wiki";

interface WikiSearchBarProps {
  /** Вызывается только при отправке формы (submit) — не при каждом символе */
  onSearch: (query: string) => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * Изолированный компонент поиска.
 * Хранит локальный стейт `value` — wiki/page.tsx не ре-рендерится при печати.
 * Показывает выпадающий список подсказок с заголовком и фрагментом текста.
 */
export const WikiSearchBar = memo(function WikiSearchBar({
  onSearch,
}: WikiSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const { suggestions } = useWikiAutocomplete(value);

  const showDropdown = isOpen && suggestions.length > 0;

  const selectSuggestion = useCallback(
    (suggestion: WikiArticleSuggestion) => {
      router.push(`/dashboard/wiki/${suggestion.slug}`);
      setValue("");
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [router],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
    } else {
      onSearch(value);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        showDropdown ? Math.min(prev + 1, suggestions.length - 1) : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (related?.closest('[role="listbox"]')) return;
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <Box mb={6} data-onboarding-id="wiki-search">
      <form onSubmit={handleSubmit}>
        <VStack align="stretch" gap={2}>
          <Box position="relative">
            <Flex gap={2}>
              <Box flex={1} position="relative">
                <Input
                  placeholder="Поиск по статьям..."
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsOpen(true)}
                  onBlur={handleBlur}
                  bg="transparent"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showDropdown}
                  aria-controls={showDropdown ? "wiki-suggestions" : undefined}
                  _placeholder={{ color: "fg.muted", opacity: 0.6 }}
                />
                {showDropdown && (
                  <Box
                    id="wiki-suggestions"
                    role="listbox"
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg="bg.panel"
                    border="1px solid"
                    borderColor="border.muted"
                    borderRadius="md"
                    boxShadow="md"
                    zIndex={10}
                    maxH="320px"
                    overflowY="auto"
                    css={{ scrollbarWidth: "thin" }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <Box
                        key={suggestion.id}
                        role="option"
                        aria-selected={index === activeIndex}
                        px={3}
                        py={2}
                        cursor="pointer"
                        bg={index === activeIndex ? "bg.subtle" : undefined}
                        _hover={{ bg: "bg.subtle" }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <Text fontWeight="medium" fontSize="sm">
                          <HighlightedText text={suggestion.title} query={value} />
                        </Text>
                        {suggestion.excerpt && (
                          <Text
                            fontSize="xs"
                            color="fg.muted"
                            overflow="hidden"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                          >
                            {suggestion.excerpt}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
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
