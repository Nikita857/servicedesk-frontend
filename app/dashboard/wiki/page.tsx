"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Stack,
  Center,
} from "@chakra-ui/react";
import { LuPlus, LuBookOpen, LuHeart } from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useWikiCategoriesWithArticlesQuery } from "@/lib/hooks";
import Link from "next/link";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { WikiSearchBar } from "@/components/features/wiki/WikiSearchBar";
import { WikiTreeView } from "@/components/features/wiki/WikiTreeView";
import { WikiFilter } from "@/lib/hooks/useWikiCategoriesWithArticlesQuery";
import type { WikiCategoryWithArticles } from "@/lib/api/wiki";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import {
  OnboardingOverlay,
  WIKI_ONBOARDING_STEPS,
} from "@/components/features/onboarding";
import { Tooltip } from "@/components/ui/tooltip";

// Module-level helper — stable reference, no re-creation on every render
function filterFavorites(
  cats: WikiCategoryWithArticles[],
): WikiCategoryWithArticles[] {
  return cats
    .map((cat) => ({
      ...cat,
      article: cat.article?.filter((a) => a.likedByCurrentUser) ?? [],
      children: filterFavorites(cat.children ?? []),
    }))
    .filter((cat) => cat.article.length > 0 || cat.children.length > 0);
}

export default function WikiPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const {
    categories,
    isLoading,
    page,
    totalPages,
    activeSearch,
    setPage,
    handleLike,
    likingArticleId,
    filter,
    setFilter,
    setShowAll,
    submitSearch,
  } = useWikiCategoriesWithArticlesQuery({ pageSize: 5 });

  const [showFavorites, setShowFavorites] = useState(false);

  const wikiOnboarding = useOnboarding(true, "sd_wiki_onboarding_seen");

  const onSearch = useCallback(
    (query: string) => {
      setShowFavorites(false);
      submitSearch(query);
    },
    [submitSearch],
  );

  const displayedCategories = useMemo(
    () => (showFavorites ? filterFavorites(categories) : categories),
    [showFavorites, categories],
  );

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

      <WikiSearchBar onSearch={onSearch} />

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
              : activeSearch
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

          {isSpecialist && !activeSearch && !showFavorites && (
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
