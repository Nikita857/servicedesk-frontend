"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Box, Input, Portal, Spinner, Text } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import { useUserSearch } from "@/lib/hooks/shared/useUserSearch";
import type { UserSearchResult } from "@/types/auth";

interface UserSearchSelectProps {
  placeholder?: string;
  /** Текущее выбранное значение — id и подпись (ФИО), т.к. сам компонент не хранит справочник. */
  value: { id: number; label: string } | null;
  onChange: (value: { id: number; label: string } | null) => void;
  size?: "sm" | "md";
}

interface AnchorRect {
  top: number;
  left: number;
  width: number;
}

/**
 * Поиск пользователя по ФИО/username с выпадающим списком — тот же паттерн
 * (debounce + AbortController + listbox), что и WikiSearchBar/useWikiAutocomplete,
 * но поверх /users/search. Используется для фильтров "Исполнитель"/"Автор".
 * <p>
 * Список подсказок рендерится через Portal с position:fixed по координатам поля,
 * а не как обычный absolute-потомок: карточка фильтров — сворачиваемая
 * (Collapsible.Content) и сама имеет overflow:hidden + скруглённые углы, поэтому
 * обычный вложенный dropdown обрезался бы почти полностью.
 */
export function UserSearchSelect({
  placeholder = "Начните вводить ФИО...",
  value,
  onChange,
  size = "sm",
}: UserSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const { results, isLoading } = useUserSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);

  const showDropdown = isOpen && (results.length > 0 || isLoading);

  useLayoutEffect(() => {
    if (!showDropdown) return;

    const updateRect = () => {
      const el = containerRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      setAnchorRect({ top: box.bottom, left: box.left, width: box.width });
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [showDropdown]);

  const selectUser = (user: UserSearchResult) => {
    onChange({ id: user.id, label: user.fio || user.username });
    setQuery("");
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
  };

  if (value) {
    return (
      <Box
        ref={containerRef}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        w="full"
        minW={0}
        h={size === "sm" ? "32px" : "40px"}
        px={3}
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="md"
        bg="bg.surface"
        fontSize="sm"
      >
        <Text truncate flex="1" minW={0} title={value.label}>
          {value.label}
        </Text>
        <Box
          as="button"
          aria-label="Сбросить"
          flexShrink={0}
          display="flex"
          alignItems="center"
          color="fg.muted"
          _hover={{ color: "fg.default" }}
          onClick={clearSelection}
        >
          <LuX size={14} />
        </Box>
      </Box>
    );
  }

  return (
    <Box ref={containerRef} position="relative" w="full" minW={0}>
      <Input
        size={size}
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={(e) => {
          const related = e.relatedTarget as HTMLElement | null;
          if (related?.closest('[role="listbox"]')) return;
          setIsOpen(false);
        }}
      />
      {showDropdown && anchorRect && (
        <Portal>
          <Box
            role="listbox"
            position="fixed"
            top={`${anchorRect.top + 4}px`}
            left={`${anchorRect.left}px`}
            width={`${anchorRect.width}px`}
            bg="bg.panel"
            border="1px solid"
            borderColor="border.muted"
            borderRadius="md"
            boxShadow="lg"
            zIndex="popover"
            maxH="260px"
            overflowY="auto"
            css={{ scrollbarWidth: "thin" }}
          >
            {isLoading ? (
              <Box px={3} py={2} display="flex" alignItems="center" gap={2}>
                <Spinner size="xs" />
                <Text fontSize="sm" color="fg.muted">
                  Поиск...
                </Text>
              </Box>
            ) : (
              results.map((user) => (
                <Box
                  key={user.id}
                  role="option"
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: "bg.subtle" }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectUser(user)}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {user.fio || user.username}
                  </Text>
                  {user.fio && (
                    <Text fontSize="xs" color="fg.muted">
                      {user.username}
                    </Text>
                  )}
                </Box>
              ))
            )}
          </Box>
        </Portal>
      )}
    </Box>
  );
}
