import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  wikiApi,
  type WikiCategoryWithArticles,
  type PagedWikiCategoryList,
  type WikiArticleListItem,
} from "@/lib/api/wiki";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/utils";
import { useState, useCallback } from "react";

interface UseWikiCategoriesWithArticlesQueryOptions {
  pageSize?: number;
}

export type WikiFilter = "my" | "public" | "all";

interface UseWikiCategoriesWithArticlesQueryReturn {
  categories: WikiCategoryWithArticles[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleLike: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId: number | null;
  filter: WikiFilter;
  setFilter: (filter: WikiFilter) => void;
  showAll: boolean;
  setShowAll: (showAll: boolean) => void;
  refetch: () => void;
}

// Helper: find article recursively in nested categories
function findArticleInCategories(
  categories: WikiCategoryWithArticles[],
  articleId: number,
): WikiArticleListItem | undefined {
  for (const cat of categories) {
    const found = cat.article?.find((a) => a.id === articleId);
    if (found) return found;
    if (cat.children?.length) {
      const deep = findArticleInCategories(cat.children, articleId);
      if (deep) return deep;
    }
  }
  return undefined;
}

// Helper: update article recursively in nested categories
function updateArticleInCategories(
  categories: WikiCategoryWithArticles[],
  articleId: number,
  updater: (a: WikiArticleListItem) => WikiArticleListItem,
): WikiCategoryWithArticles[] {
  return categories.map((cat) => ({
    ...cat,
    article: cat.article?.map((a) =>
      a.id === articleId ? updater(a) : a,
    ) ?? [],
    children: cat.children?.length
      ? updateArticleInCategories(cat.children, articleId, updater)
      : [],
  }));
}

/**
 * Hook for fetching wiki categories with articles, search, pagination, and like mutations
 */
export function useWikiCategoriesWithArticlesQuery(
  options: UseWikiCategoriesWithArticlesQueryOptions = {},
): UseWikiCategoriesWithArticlesQueryReturn {
  const { pageSize = 5 } = options; // 5 categories per page
  const queryClient = useQueryClient();

  // Local state for search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [likingArticleId, setLikingArticleId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilterState] = useState<WikiFilter>("my");

  const setFilter = useCallback((newFilter: WikiFilter) => {
    setFilterState(newFilter);
    setPage(0);
  }, []);

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: queryKeys.wiki.categoriesWithArticles({
      page,
      search: debouncedSearch,
      showAll,
      filter,
    }),
    queryFn: async () => {
      // Use search endpoint if there's a search query, otherwise use list endpoint
      if (debouncedSearch) {
        return await wikiApi.searchCategories(
          debouncedSearch,
          page,
          pageSize,
          showAll,
          filter === "my",
          filter === "public",
        );
      } else {
        return await wikiApi.listCategories(
          page,
          pageSize,
          showAll,
          filter === "my",
          filter === "public",
        );
      }
    },
    staleTime: 30 * 1000,
  });

  // Like mutation with optimistic update
  const likeMutation = useMutation({
    mutationFn: async ({
      articleId,
      isLiked,
    }: {
      articleId: number;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        await wikiApi.unlike(articleId);
      } else {
        await wikiApi.like(articleId);
      }
      return { articleId, wasLiked: isLiked };
    },
    onMutate: async ({ articleId, isLiked }) => {
      const queryKey = queryKeys.wiki.categoriesWithArticles({
        page,
        search: debouncedSearch,
        showAll,
        filter,
      });

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        (old: PagedWikiCategoryList | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: updateArticleInCategories(
              old.content,
              articleId,
              (a) => ({
                ...a,
                likedByCurrentUser: !isLiked,
                likeCount: isLiked
                  ? Math.max(0, a.likeCount - 1)
                  : a.likeCount + 1,
              }),
            ),
          };
        },
      );

      setLikingArticleId(articleId);
      return { previousData };
    },
    onSuccess: (_, { isLiked }) => {
      toast.success(
        isLiked
          ? "Статья удалена из избранного"
          : "Статья добавлена в избранное",
      );
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.wiki.categoriesWithArticles({
            page,
            search: debouncedSearch,
            showAll,
            filter,
          }),
          context.previousData,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Не удалось обновить лайк";
      toast.error("Ошибка", errorMessage);
    },
    onSettled: () => {
      setLikingArticleId(null);
    },
  });

  // Handle search submission
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(0);
      setDebouncedSearch(searchQuery);
    },
    [searchQuery],
  );

  // Handle like button click
  const handleLike = useCallback(
    (e: React.MouseEvent, articleId: number) => {
      e.preventDefault();
      e.stopPropagation();

      const article = findArticleInCategories(
        categoriesQuery.data?.content ?? [],
        articleId,
      );
      if (!article) return;

      likeMutation.mutate({
        articleId,
        isLiked: article.likedByCurrentUser,
      });
    },
    [categoriesQuery.data?.content, likeMutation],
  );

  return {
    categories: categoriesQuery.data?.content ?? [],
    isLoading: categoriesQuery.isLoading,
    page,
    totalPages: categoriesQuery.data?.page?.totalPages ?? 0,
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
    refetch: categoriesQuery.refetch,
  };
}
