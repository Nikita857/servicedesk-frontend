import { useState, useEffect, useCallback } from "react";
import { wikiApi } from "@/lib/api/wiki";

/**
 * Hook for wiki search autocomplete with debounce
 */
export function useWikiAutocomplete(query: string, delay: number = 300) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await wikiApi.autocomplete(searchQuery);
      setSuggestions(data);
    } catch (error) {
      console.error("[Autocomplete] Error fetching suggestions:", error);
      setSuggestions([]);
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
    isLoading,
    clearSuggestions: () => setSuggestions([]),
  };
}
