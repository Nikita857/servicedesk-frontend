"use client";

import { FormEvent, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  Spinner,
  Stack,
  Center,
} from "@chakra-ui/react";
import { LuPlus, LuSearch, LuBookOpen, LuHeart } from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useWikiCategoriesWithArticlesQuery } from "@/lib/hooks";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useWikiAutocomplete } from "@/lib/hooks/useWikiAutocomplete";
import { WikiTreeView } from "@/components/features/wiki/WikiTreeView";
import { WikiFilter } from "@/lib/hooks/useWikiCategoriesWithArticlesQuery";
import type { WikiCategoryWithArticles } from "@/lib/api/wiki";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import {
  OnboardingOverlay,
  WIKI_ONBOARDING_STEPS,
} from "@/components/features/onboarding";
import { Tooltip } from "@/components/ui/tooltip";

export default function WikiPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const {
    categories,
    isLoading,
    page,
    totalPages,
    searchQuery,
    setSearchQuery,
    setPage,
    handleSearch,
    handleLike,
    likingArticleId,
    filter,
    setFilter,
    setShowAll,
  } = useWikiCategoriesWithArticlesQuery({ pageSize: 5 });
  const { hint } = useWikiAutocomplete(searchQuery);

  const [showFavorites, setShowFavorites] = useState(false);

  const wikiOnboarding = useOnboarding(true, "sd_wiki_onboarding_seen");

  // Reset favorites filter on search
  const onSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowFavorites(false);
    handleSearch(e as FormEvent<Element>);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && hint) {
      // If cursor is at the end of text or it's a Tab press
      const isAtEnd =
        (e.target as HTMLInputElement).selectionStart === searchQuery.length;

      if (e.key === "Tab" || isAtEnd) {
        e.preventDefault();
        setSearchQuery(hint);
      }
    }
  };

  // Recursively filter categories to show only liked articles
  const filterFavorites = (
    cats: WikiCategoryWithArticles[],
  ): WikiCategoryWithArticles[] => {
    return cats
      .map((cat) => ({
        ...cat,
        article: cat.article?.filter((a) => a.likedByCurrentUser) ?? [],
        children: filterFavorites(cat.children ?? []),
      }))
      .filter((cat) => cat.article.length > 0 || cat.children.length > 0);
  };

  const displayedCategories = showFavorites
    ? filterFavorites(categories)
    : categories;

  return (
    <Box>
      <OnboardingOverlay
        steps={WIKI_ONBOARDING_STEPS}
        controls={wikiOnboarding}
      />

      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Flex align="center" gap={2}>
          <Box>
            <Heading size="lg" color="fg.default" mb={1}>
              База знаний
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Статьи и документация
            </Text>
          </Box>
        </Flex>

        <Stack
          direction={{ base: "column", md: "row" }}
          gap={2}
          align={{ base: "stretch", md: "center" }}
        >
          {/* Favorites filter */}
          <Button
            data-onboarding-id="wiki-fav"
            variant={showFavorites ? "solid" : "outline"}
            colorPalette={showFavorites ? "red" : "gray"}
            onClick={() => {
              setShowFavorites(!showFavorites);
              if (!showFavorites) setShowAll(false);
            }}
            size={{ base: "sm", md: "md" }}
          >
            <LuHeart />
            <Text hideBelow="sm">Избранное</Text>
          </Button>

          <Box data-onboarding-id="wiki-switcher">
            <SegmentedControl
              value={filter}
              onValueChange={(e) => {
                const val = e.value as WikiFilter;
                setFilter(val);
                if (val === "all") {
                  setShowAll(true);
                } else {
                  setShowAll(false);
                }
                if (val !== "all") setShowFavorites(false);
              }}
              items={[
                { value: "my", label: "Мой отдел" },
                { value: "public", label: "Публичные" },
                { value: "all", label: "Все статьи" },
              ]}
              size="sm"
              width={{ base: "full", md: "auto" }}
            />
          </Box>

          {isSpecialist && (
            <Link href="/dashboard/wiki/new">
              <Button
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
                size={{ base: "sm", md: "md" }}
              >
                <LuPlus />
                <Text hideBelow="sm">Новая статья</Text>
              </Button>
            </Link>
          )}
        </Stack>
      </Flex>

      {/* Search */}
      <Box mb={6} data-onboarding-id="wiki-search">
        <form onSubmit={onSearch}>
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
                  px="calc(12px + 1px)" // Input padding + border
                  py="calc(8px + 1px)"
                  pointerEvents="none"
                  fontSize="md"
                  fontFamily="inherit"
                  color="fg.muted"
                  opacity={0.5}
                  whiteSpace="pre"
                  overflow="hidden"
                >
                  {/* Invisible text to push hint to the right position */}
                  <Box as="span" opacity={0}>
                    {searchQuery}
                  </Box>
                  {/* The actual hint part */}
                  {hint.slice(searchQuery.length)}
                </Box>
              )}

              <Flex gap={2}>
                <Input
                  placeholder="Поиск по статьям..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Categories with Accordions */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      ) : displayedCategories.length === 0 ? (
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          textAlign="center"
        >
          <LuBookOpen size={48} style={{ margin: "0 auto", opacity: 0.3 }} />
          <Text color="fg.muted" mt={4}>
            {showFavorites
              ? "У вас пока нет избранных статей"
              : searchQuery
                ? "Статьи не найдены"
                : "Нет статей в базе знаний"}
          </Text>
          {showFavorites && (
            <Button
              mt={4}
              variant="outline"
              onClick={() => setShowFavorites(false)}
            >
              Показать все статьи
            </Button>
          )}
          {filter !== "my" && !showFavorites && (
            <Button mt={4} variant="outline" onClick={() => setFilter("my")}>
              Вернуться к моему отделу
            </Button>
          )}

          {isSpecialist && !searchQuery && !showFavorites && (
            <Link href="/dashboard/wiki/new">
              <Button
                mt={4}
                bg="gray.900"
                color="white"
                _hover={{ bg: "gray.800" }}
              >
                <LuPlus />
                Создать первую статью
              </Button>
            </Link>
          )}
        </Box>
      ) : (
        <>
          <WikiTreeView
            onBoardingId="wiki-tree"
            categories={displayedCategories}
            onLike={handleLike}
            likingArticleId={likingArticleId}
          />

          {/* Pagination */}
          {totalPages > 1 && !showFavorites && (
            <Flex justify="center" mt={6} gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Назад
              </Button>
              <Text alignSelf="center" fontSize="sm" color="fg.muted">
                {page + 1} / {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Вперёд
              </Button>
            </Flex>
          )}
        </>
      )}
      <Center mt={10}>
        <Tooltip
          content="Показать обучение"
          showArrow
          positioning={{ placement: "bottom" }}
        >
          <Button
            aria-label="Показать обучение по вики"
            variant="ghost"
            size="md"
            bg="red.500"
            color="white"
            onClick={wikiOnboarding.start}
            mt={-4}
          >
            Я ничего не понимаю!
          </Button>
        </Tooltip>
      </Center>
    </Box>
  );
}
