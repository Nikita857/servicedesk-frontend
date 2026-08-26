import { useState, useEffect, useRef } from "react";
import { userApi } from "@/lib/api/users";
import type { UserSearchResult } from "@/types/auth";

/**
 * Hook for user search suggestions (assignee/author pickers) with debounce
 * and request cancellation. Mirrors useWikiAutocomplete.
 */
export function useUserSearch(query: string, delay: number = 300) {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      try {
        const data = await userApi.search(query.trim());
        setResults(data);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("[useUserSearch] Error fetching users:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, delay]);

  return { results, isLoading };
}
