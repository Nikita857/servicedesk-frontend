"use client";

import {
  Box,
  HStack,
  Text,
  Badge,
  Collapsible,
  VStack,
} from "@chakra-ui/react";
import { LuChevronRight, LuChevronDown, LuFolder, LuFolderOpen } from "react-icons/lu";
import { useEffect } from "react";
import type { WikiCategoryWithArticles } from "@/lib/api/wiki";
import { TreeViewListBoxItem } from "./TreeViewListBoxItem";
import { useWikiTreeState } from "@/lib/hooks/useWikiTreeState";

// --- Рекурсивный узел категории ---
interface CategoryNodeProps {
  category: WikiCategoryWithArticles;
  depth?: number;
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
  isOpen: boolean;
  getIsOpen: (id: number) => boolean;
  onToggle: (id: number) => void;
}

const CategoryNode = ({
  category,
  depth = 0,
  onLike,
  likingArticleId,
  isOpen,
  getIsOpen,
  onToggle,
}: CategoryNodeProps) => {
  const hasChildren = category.children && category.children.length > 0;
  const hasArticles = category.article && category.article.length > 0;
  const articleCount = countArticles(category);
  const indent = Math.min(depth * 16, 64) + 12;

  return (
    <Box w="full">
      {/* Category header */}
      <HStack
        gap={2}
        py={2}
        px={3}
        pl={`${indent}px`}
        cursor="pointer"
        borderRadius="md"
        transition="background 0.15s"
        _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.50" } }}
        onClick={() => onToggle(category.id)}
      >
        <Box color="fg.muted" flexShrink={0}>
          {isOpen ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
        </Box>

        <Box color="blue.500" flexShrink={0}>
          {isOpen ? <LuFolderOpen size={18} /> : <LuFolder size={18} />}
        </Box>

        <Text fontWeight="medium" fontSize="sm" flex={1} minW={0} truncate>
          {category.name}
        </Text>

        <Badge colorPalette="blue" variant="subtle" size="sm" flexShrink={0}>
          {articleCount}{" "}
          {articleCount === 1
            ? "статья"
            : articleCount < 5 && articleCount !== 0
              ? "статьи"
              : "статей"}
        </Badge>
      </HStack>

      {/* Content (articles + child categories) */}
      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          {/* Articles in this category */}
          {hasArticles && (
            <Box
              pl={{ base: `${Math.min(depth * 12, 48) + 24}px`, md: `${Math.min(depth * 20, 80) + 32}px` }}
              pr={2}
              py={1}
            >
              <TreeViewListBoxItem
                articles={category.article}
                onLike={onLike}
                likingArticleId={likingArticleId}
              />
            </Box>
          )}

          {/* Child categories */}
          {hasChildren && (
            <VStack gap={0} align="stretch">
              {category.children.map((child) => (
                <CategoryNode
                  key={child.id}
                  category={child}
                  depth={depth + 1}
                  onLike={onLike}
                  likingArticleId={likingArticleId}
                  isOpen={getIsOpen(child.id)}
                  getIsOpen={getIsOpen}
                  onToggle={onToggle}
                />
              ))}
            </VStack>
          )}

          {/* Empty category */}
          {!hasArticles && !hasChildren && (
            <Box pl={`${indent + 36}px`} py={2}>
              <Text fontSize="sm" color="fg.muted">
                Нет статей в категории
              </Text>
            </Box>
          )}
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

// Count total articles in category and all its children
function countArticles(category: WikiCategoryWithArticles): number {
  let count = category.article?.length ?? 0;
  if (category.children?.length) {
    for (const child of category.children) {
      count += countArticles(child);
    }
  }
  return count;
}

// --- Main component ---
interface WikiTreeViewProps {
  onBoardingId: string
  categories: WikiCategoryWithArticles[];
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
}

export const WikiTreeView = ({
  onBoardingId,
  categories,
  onLike,
  likingArticleId,
}: WikiTreeViewProps) => {
  const rootIds = categories.map((c) => c.id);
  const { isOpen, toggle, openAll } = useWikiTreeState(rootIds);

  // При изменении списка категорий (поиск, фильтр) — открываем корневые
  useEffect(() => {
    if (rootIds.length > 0) {
      openAll(rootIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Box
      id={onBoardingId}
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      py={2}
      overflowX="hidden"
    >
      <VStack gap={0} align="stretch">
        {categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            depth={0}
            onLike={onLike}
            likingArticleId={likingArticleId}
            isOpen={isOpen(category.id)}
            getIsOpen={isOpen}
            onToggle={toggle}
          />
        ))}
      </VStack>
    </Box>
  );
};
