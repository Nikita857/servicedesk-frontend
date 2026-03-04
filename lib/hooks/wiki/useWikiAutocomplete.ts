import { useState, useEffect, useRef } from "react";
import { wikiApi, type WikiArticleSuggestion } from "@/lib/api/wiki";

/**
 * Hook for wiki search suggestions with debounce and request cancellation.
 */
export function useWikiAutocomplete(query: string, delay: number = 300) {
  const [suggestions, setSuggestions] = useState<WikiArticleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      try {
        const data = await wikiApi.suggest(query.trim());
        setSuggestions(data);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("[WikiAutocomplete] Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, delay]);

  return { suggestions, isLoading };
}
