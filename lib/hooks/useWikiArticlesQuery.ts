import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wikiApi, type WikiArticleListItem } from "@/lib/api/wiki";
import { queryKeys } from "@/lib/queryKeys";
import { toaster } from "@/components/ui/toaster";
import { useState, useCallback } from "react";

interface UseWikiArticlesQueryOptions {
  pageSize?: number;
}

interface UseWikiArticlesQueryReturn {
  articles: WikiArticleListItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleLike: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId: number | null;
  refetch: () => void;
}

/**
 * Hook for fetching wiki articles with search, pagination, and like mutations
 * Replaces legacy useState + useEffect pattern in wiki page
 */
export function useWikiArticlesQuery(
  options: UseWikiArticlesQueryOptions = {}
): UseWikiArticlesQueryReturn {
  const { pageSize = 12 } = options;
  const queryClient = useQueryClient();

  // Local state for search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [likingArticleId, setLikingArticleId] = useState<number | null>(null);

  // Articles query
  const articlesQuery = useQuery({
    queryKey: queryKeys.wiki.list({ page, search: debouncedSearch }),
    queryFn: async () => {
      const response = debouncedSearch
        ? await wikiApi.search(debouncedSearch, page, pageSize)
        : await wikiApi.list(page, pageSize);
      return response;
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.wiki.list({ page, search: debouncedSearch }),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        queryKeys.wiki.list({ page, search: debouncedSearch })
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.wiki.list({ page, search: debouncedSearch }),
        (old: { content: WikiArticleListItem[]; totalPages: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((a) =>
              a.id === articleId
                ? {
                    ...a,
                    likedByCurrentUser: !isLiked,
                    likeCount: isLiked
                      ? Math.max(0, a.likeCount - 1)
                      : a.likeCount + 1,
                  }
                : a
            ),
          };
        }
      );

      setLikingArticleId(articleId);
      return { previousData };
    },
    onSuccess: (_, { isLiked }) => {
      toaster.success({
        title: isLiked
          ? "Статья удалена из избранного"
          : "Статья добавлена в избранное",
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.wiki.list({ page, search: debouncedSearch }),
          context.previousData
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Не удалось обновить лайк";
      toaster.error({ title: errorMessage });
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
    [searchQuery]
  );

  // Handle like button click
  const handleLike = useCallback(
    (e: React.MouseEvent, articleId: number) => {
      e.preventDefault();
      e.stopPropagation();

      const article = articlesQuery.data?.content.find((a) => a.id === articleId);
      if (!article) return;

      likeMutation.mutate({
        articleId,
        isLiked: article.likedByCurrentUser,
      });
    },
    [articlesQuery.data?.content, likeMutation]
  );

  return {
    articles: articlesQuery.data?.content ?? [],
    isLoading: articlesQuery.isLoading,
    page,
    totalPages: articlesQuery.data?.totalPages ?? 0,
    searchQuery,
    setSearchQuery,
    setPage,
    handleSearch,
    handleLike,
    likingArticleId,
    refetch: articlesQuery.refetch,
  };
}
