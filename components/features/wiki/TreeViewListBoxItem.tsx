"use client";

import {
  Listbox,
  createListCollection,
  Text,
  HStack,
  Flex,
  VStack,
  Box,
} from "@chakra-ui/react";
import { LuHeart, LuUser, LuClock, LuFile } from "react-icons/lu";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { WikiArticleListItem } from "@/lib/api/wiki";

interface TreeViewListBoxItemProps {
  articles: WikiArticleListItem[];
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
}

/**
 * Listbox component to display articles within a TreeView category
 * Replaces card layout with a cleaner list view
 */
export const TreeViewListBoxItem = ({
  articles,
}: TreeViewListBoxItemProps) => {
  console.log("TreeViewListBoxItem articles:", articles);

  const collection = createListCollection({
    items: articles.map((article) => ({
      label: article.title,
      value: article.slug,
      data: article,
    })),
  });

  console.log("TreeViewListBoxItem collection:", collection);

  return (
    <Listbox.Root collection={collection} width="full">
      <Listbox.Content>
        {collection.items.map((item) => {
          const article = item.data;
          return (
            <Listbox.Item
              key={item.value}
              item={item}
              asChild
              cursor="pointer"
              borderRadius="md"
              transition="all 0.2s"
              _hover={{
                bg: "bg.muted",
                transform: "translateX(4px)",
              }}
            >
              <Link href={`/dashboard/wiki/${article.slug}`}>
                <Box w="full" py={1}>
                  {/* Desktop версия */}
                  <Flex
                    align="center"
                    justify="space-between"
                    gap={3}
                    w="full"
                    hideBelow="md"
                  >
                    {/* Left: Icon + Title */}
                    <HStack gap={2} flex={1} minW={0}>
                      <LuFile size={16} style={{ flexShrink: 0 }} />
                      <Text
                        fontWeight="medium"
                        fontSize="sm"
                        color={
                          article.likedByCurrentUser ? "red.500" : "fg.default"
                        }
                        lineClamp={1}
                      >
                        {article.title}
                      </Text>
                      {article.likedByCurrentUser && (
                        <LuHeart
                          size={12}
                          fill="currentColor"
                          color="red.500"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </HStack>

                    {/* Right: Metadata */}
                    <HStack
                      gap={3}
                      fontSize="xs"
                      color="fg.muted"
                      flexShrink={0}
                    >
                      <HStack gap={1}>
                        <LuUser size={12} />
                        <Text>
                          {article.author?.fio || article.author?.username || "Аноним"}
                        </Text>
                      </HStack>
                      <HStack gap={1}>
                        <LuClock size={12} />
                        <Text>{formatDate(article.updatedAt)}</Text>
                      </HStack>
                    </HStack>
                  </Flex>

                  {/* Mobile версия */}
                  <VStack align="start" gap={1} hideFrom="md" w="full">
                    {/* Заголовок с иконкой */}
                    <HStack gap={2} w="full">
                      <LuFile size={16} style={{ flexShrink: 0 }} />
                      <Text
                        fontWeight="medium"
                        fontSize="sm"
                        color={
                          article.likedByCurrentUser ? "red.500" : "fg.default"
                        }
                        lineClamp={2}
                        flex={1}
                      >
                        {article.title}
                      </Text>
                      {article.likedByCurrentUser && (
                        <LuHeart
                          size={12}
                          fill="currentColor"
                          color="red.500"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </HStack>

                    {/* Метаданные под заголовком */}
                    <HStack
                      gap={3}
                      fontSize="xs"
                      color="fg.muted"
                      pl={6} // отступ для выравнивания с текстом
                    >
                      <HStack gap={1}>
                        <LuUser size={10} />
                        <Text>
                          {article.author?.fio || article.author?.username || "Аноним"}
                        </Text>
                      </HStack>
                      <HStack gap={1}>
                        <LuClock size={10} />
                        <Text>{formatDate(article.updatedAt)}</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              </Link>
            </Listbox.Item>
          );
        })}
      </Listbox.Content>
    </Listbox.Root>
  );
};
