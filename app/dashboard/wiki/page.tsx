"use client";

import { useState, useEffect, useCallback } from "react";
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
import Link from "next/link";
import { wikiApi, type WikiArticleListItem } from "@/lib/api/wiki";
import { useAuthStore } from "@/stores";

export default function WikiPage() {
  const { user } = useAuthStore();
  const isSpecialist = user?.specialist || false;

  const [articles, setArticles] = useState<WikiArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = searchQuery
        ? await wikiApi.search(searchQuery, page, 12)
        : await wikiApi.list(page, 12);
      setArticles(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load articles", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchArticles();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

        {isSpecialist && (
          <Link href="/dashboard/wiki/new">
            <Button bg="gray.900" color="white" _hover={{ bg: "gray.800" }}>
              <LuPlus />
              Новая статья
            </Button>
          </Link>
        )}
      </Flex>

      {/* Search */}
      <Box mb={6}>
        <form onSubmit={handleSearch}>
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
        </form>
      </Box>

      {/* Articles Grid */}
      {isLoading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner />
        </Flex>
      ) : articles.length === 0 ? (
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
            {searchQuery ? "Статьи не найдены" : "Нет статей в базе знаний"}
          </Text>
          {isSpecialist && !searchQuery && (
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
            {articles.map((article) => (
              <Link key={article.id} href={`/dashboard/wiki/${article.slug}`}>
                <Box
                  bg="bg.surface"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  p={5}
                  h="100%"
                  _hover={{
                    borderColor: "fg.subtle",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s",
                  }}
                  cursor="pointer"
                >
                  <VStack align="stretch" gap={3}>
                    {/* Title */}
                    <Heading size="sm" color="fg.default" lineClamp={2}>
                      {article.title}
                    </Heading>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <Text color="fg.muted" fontSize="sm" lineClamp={3}>
                        {article.excerpt}
                      </Text>
                    )}

                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <HStack gap={1} flexWrap="wrap">
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
                        <Text>{article.authorName || "Аноним"}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <LuEye size={12} />
                        <Text>{article.viewCount}</Text>
                      </HStack>
                      <HStack gap={1}>
                        <LuHeart size={12}/>
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
          {totalPages > 1 && (
            <Flex justify="center" mt={6} gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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
