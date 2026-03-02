import { useState, useEffect, useCallback } from "react";
import { wikiApi } from "@/lib/api/wiki";

/**
 * Hook for wiki search autocomplete with debounce
 */
export function useWikiAutocomplete(query: string, delay: number = 300) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState("");

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setHint("");
      return;
    }

    setIsLoading(true);
    try {
      const data = await wikiApi.autocomplete(searchQuery);
      setSuggestions(data);

      // Find the best hint: first suggestion that starts with current query (case-insensitive)
      const bestMatch = data.find((s) =>
        s.toLowerCase().startsWith(searchQuery.toLowerCase()),
      );

      if (bestMatch && bestMatch.toLowerCase() !== searchQuery.toLowerCase()) {
        // We only want to show hint if it's longer than current query
        // and actually starts with it
        setHint(bestMatch);
      } else {
        setHint("");
      }
    } catch (error) {
      console.error("[Autocomplete] Error fetching suggestions:", error);
      setSuggestions([]);
      setHint("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, fetchSuggestions]);

  return {
    suggestions,
    hint,
    isLoading,
    clearSuggestions: () => {
      setSuggestions([]);
      setHint("");
    },
  };
}
