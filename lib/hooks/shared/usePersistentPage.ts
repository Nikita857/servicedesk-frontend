import { useState, useCallback } from "react";

const PREFIX = "sd_page_";

/**
 * useState(0) replacement that persists the current page in sessionStorage.
 * When the component remounts (e.g. after navigating back), the page is restored.
 */
export function usePersistentPage(
  key: string,
): [number, (page: number) => void] {
  const [page, setPageRaw] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const stored = sessionStorage.getItem(PREFIX + key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  const setPage = useCallback(
    (p: number) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PREFIX + key, String(p));
      }
      setPageRaw(p);
    },
    [key],
  );

  return [page, setPage];
}
