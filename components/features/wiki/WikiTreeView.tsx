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
import { useState } from "react";
import type { WikiCategoryWithArticles } from "@/lib/api/wiki";
import { TreeViewListBoxItem } from "./TreeViewListBoxItem";

// --- Рекурсивный узел категории ---
interface CategoryNodeProps {
  category: WikiCategoryWithArticles;
  depth?: number;
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
  defaultOpen?: boolean;
}

const CategoryNode = ({
  category,
  depth = 0,
  onLike,
  likingArticleId,
  defaultOpen = true,
}: CategoryNodeProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = category.children && category.children.length > 0;
  const hasArticles = category.article && category.article.length > 0;
  const articleCount = countArticles(category);

  return (
    <Box w="full">
      {/* Category header */}
      <HStack
        gap={2}
        py={2}
        px={3}
        pl={`${depth * 20 + 12}px`}
        cursor="pointer"
        borderRadius="md"
        transition="background 0.15s"
        _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.50" } }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Box color="fg.muted" flexShrink={0}>
          {isOpen ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
        </Box>

        <Box color="blue.500" flexShrink={0}>
          {isOpen ? <LuFolderOpen size={18} /> : <LuFolder size={18} />}
        </Box>

        <Text fontWeight="medium" fontSize="sm">
          {category.name}
        </Text>

        <Badge colorPalette="blue" variant="subtle" size="sm">
          {articleCount}{" "}
          {articleCount === 1
            ? "статья"
            : articleCount < 5 && articleCount != 0
              ? "статьи"
              : "статей"}
        </Badge>
      </HStack>

      {/* Content (articles + child categories) */}
      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          {/* Articles in this category */}
          {hasArticles && (
            <Box pl={`${depth * 20 + 32}px`} pr={2} py={1}>
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
                  defaultOpen={false}
                />
              ))}
            </VStack>
          )}

          {/* Empty category */}
          {!hasArticles && !hasChildren && (
            <Box pl={`${depth * 20 + 48}px`} py={2}>
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
  categories: WikiCategoryWithArticles[];
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
}

export const WikiTreeView = ({
  categories,
  onLike,
  likingArticleId,
}: WikiTreeViewProps) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <Box
      bg="bg.surface"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      py={2}
    >
      <VStack gap={0} align="stretch">
        {categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            depth={0}
            onLike={onLike}
            likingArticleId={likingArticleId}
            defaultOpen={true}
          />
        ))}
      </VStack>
    </Box>
  );
};
