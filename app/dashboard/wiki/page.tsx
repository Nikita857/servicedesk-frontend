"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Spinner,
  Badge,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuBookOpen,
  LuEye,
  LuHeart,
  LuUser,
  LuClock,
} from "react-icons/lu";
import { useAuthStore } from "@/stores";
import { useWikiArticlesQuery } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { SegmentedControl } from "@/components/ui/segmented-control";

export default function WikiPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  // Use TanStack Query for wiki articles
  const {
    articles,
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
    showAll,
    setShowAll,
  } = useWikiArticlesQuery();

  const [showFavorites, setShowFavorites] = useState(false);

  // Reset favorites filter on search
  const onSearch = (e: React.FormEvent) => {
    setShowFavorites(false);
    handleSearch(e);
  };

  // Filter articles for favorites display
  const displayedArticles = showFavorites
    ? articles.filter((a) => a.likedByCurrentUser)
    : articles;

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            База знаний
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Статьи и документация для специалистов
          </Text>
        </Box>

        <HStack gap={2}>
          {/* Favorites filter */}
          <Button
            variant={showFavorites ? "solid" : "outline"}
            colorPalette={showFavorites ? "red" : "gray"}
            onClick={() => {
              setShowFavorites(!showFavorites);
              if (!showFavorites) setShowAll(false);
            }}
          >
            <LuHeart />
            Избранное
          </Button>

          <SegmentedControl
            value={filter}
            onValueChange={(e) => {
              const val = e.value as any;
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
          />

          {isSpecialist && (
            <Link href="/dashboard/wiki/new">
              <Button bg="gray.900" color="white" _hover={{ bg: "gray.800" }}>
                <LuPlus />
                Новая статья
              </Button>
            </Link>
          )}
        </HStack>
      </Flex>

      {/* Search */}
      <Box mb={6}>
        <form onSubmit={onSearch}>
          <VStack align="stretch" gap={2}>
            <Flex gap={2}>
              <Input
                placeholder="Поиск по статьям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="bg.surface"
                flex={1}
              />
              <Button type="submit" variant="outline">
                <LuSearch />
                Найти
              </Button>
            </Flex>
            {filter === "all" && (
              <Text fontSize="xs" color="fg.muted" ml={1}>
                Поиск выполняется по всей базе знаний (включая другие отделы)
              </Text>
            )}
          </VStack>
        </form>
      </Box>

      {/* Articles Grid */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      ) : displayedArticles.length === 0 ? (
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {displayedArticles.map((article) => (
              <Link key={article.id} href={`/dashboard/wiki/${article.slug}`}>
                <Box
                  bg="bg.surface"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={
                    article.likedByCurrentUser ? "red.200" : "border.default"
                  }
                  p={5}
                  h="100%"
                  _hover={{
                    borderColor: article.likedByCurrentUser
                      ? "red.400"
                      : "fg.subtle",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s",
                  }}
                  cursor="pointer"
                  position="relative"
                >
                  {/* Like badge indicator */}
                  {article.likedByCurrentUser && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorPalette="red"
                      variant="subtle"
                      size="sm"
                    >
                      <LuHeart size={10} style={{ marginRight: 4 }} />В
                      избранном
                    </Badge>
                  )}

                  <VStack align="stretch" gap={3}>
                    {/* Title & Category */}
                    <HStack align="flex-start" justify="space-between" gap={2}>
                      <Heading
                        size="sm"
                        color="fg.default"
                        lineClamp={2}
                        pr={article.likedByCurrentUser ? 20 : 0}
                        flex={1}
                      >
                        {article.title}
                      </Heading>
                      {article.categoryName && (
                        <Tooltip
                          content={
                            article.departmentName
                              ? `Категория статей отдела: ${article.departmentName}`
                              : "Общая категория"
                          }
                        >
                          <Badge
                            colorPalette="purple"
                            variant="subtle"
                            size="sm"
                            flexShrink={0}
                          >
                            {article.categoryName}
                          </Badge>
                        </Tooltip>
                      )}
                    </HStack>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <Text color="fg.muted" fontSize="sm" lineClamp={3}>
                        {article.excerpt}
                      </Text>
                    )}

                    {/* Tags (moved to bottom) */}
                    {article.tags.length > 0 && (
                      <HStack gap={1} flexWrap="wrap" mb={1}>
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            size="sm"
                            colorPalette="blue"
                            variant="subtle"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge size="sm" variant="subtle">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </HStack>
                    )}

                    {/* Meta */}

                    <HStack
                      gap={3}
                      fontSize="xs"
                      color="fg.muted"
                      mt="auto"
                      pt={2}
                      borderTopWidth="1px"
                      borderColor="border.default"
                    >
                      <HStack gap={1}>
                        <LuUser size={12} />
                        <Text>
                          {article.author?.fio ||
                            article.author?.username ||
                            "Аноним"}
                        </Text>
                      </HStack>
                      <HStack gap={1}>
                        <LuEye size={12} />
                        <Text>{article.viewCount}</Text>
                      </HStack>

                      {/* Like button */}
                      <HStack
                        gap={1}
                        as="button"
                        onClick={(e) => handleLike(e, article.id)}
                        color={
                          article.likedByCurrentUser ? "red.500" : "fg.muted"
                        }
                        _hover={{ color: "red.500" }}
                        transition="color 0.2s"
                        cursor="pointer"
                      >
                        {likingArticleId === article.id ? (
                          <Spinner size="xs" />
                        ) : (
                          <LuHeart
                            size={12}
                            fill={
                              article.likedByCurrentUser
                                ? "currentColor"
                                : "none"
                            }
                          />
                        )}
                        <Text>{article.likeCount}</Text>
                      </HStack>

                      <HStack gap={1} ml="auto">
                        <LuClock size={12} />
                        <Text>{formatDate(article.updatedAt)}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </Link>
            ))}
          </SimpleGrid>

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
    </Box>
  );
}
