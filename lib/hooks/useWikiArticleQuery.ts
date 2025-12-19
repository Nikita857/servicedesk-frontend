import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wikiApi, type WikiArticle } from "@/lib/api/wiki";
import { queryKeys } from "@/lib/queryKeys";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";

interface UseWikiArticleQueryReturn {
  article: WikiArticle | null;
  isLoading: boolean;
  isLiking: boolean;
  error: Error | null;
  handleLike: () => void;
  refetch: () => void;
}

/**
 * Hook for fetching a single wiki article by slug
 * Includes like/unlike mutation with optimistic updates
 */
export function useWikiArticleQuery(slug: string): UseWikiArticleQueryReturn {
  const queryClient = useQueryClient();
  const [isLiking, setIsLiking] = useState(false);

  // Article query
  const articleQuery = useQuery({
    queryKey: queryKeys.wiki.detail(slug),
    queryFn: async () => {
      const article = await wikiApi.getBySlug(slug);
      return article;
    },
    enabled: !!slug,
  });

  // Like mutation with optimistic update
  const likeMutation = useMutation({
    mutationFn: async ({ isLiked }: { isLiked: boolean }) => {
      const article = articleQuery.data;
      if (!article) throw new Error("No article");

      if (isLiked) {
        await wikiApi.unlike(article.id);
      } else {
        await wikiApi.like(article.id);
      }
      return { wasLiked: isLiked };
    },
    onMutate: async ({ isLiked }) => {
      setIsLiking(true);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.wiki.detail(slug),
      });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<WikiArticle>(
        queryKeys.wiki.detail(slug)
      );

      // Optimistically update
      if (previousArticle) {
        queryClient.setQueryData<WikiArticle>(queryKeys.wiki.detail(slug), {
          ...previousArticle,
          likedByCurrentUser: !isLiked,
          likeCount: isLiked
            ? Math.max(0, previousArticle.likeCount - 1)
            : previousArticle.likeCount + 1,
        });
      }

      return { previousArticle };
    },
    onSuccess: (_, { isLiked }) => {
      toaster.success({
        title: isLiked
          ? "Статья удалена из избранного"
          : "Статья добавлена в избранное!",
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousArticle) {
        queryClient.setQueryData(
          queryKeys.wiki.detail(slug),
          context.previousArticle
        );
      }
      toaster.error({
        title: "Ошибка",
        description: "Не удалось обновить лайк",
      });
    },
    onSettled: () => {
      setIsLiking(false);
    },
  });

  const handleLike = () => {
    const article = articleQuery.data;
    if (!article) return;

    likeMutation.mutate({
      isLiked: article.likedByCurrentUser,
    });
  };

  return {
    article: articleQuery.data ?? null,
    isLoading: articleQuery.isLoading,
    isLiking,
    error: articleQuery.error,
    handleLike,
    refetch: articleQuery.refetch,
  };
}
