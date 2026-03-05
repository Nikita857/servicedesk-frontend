import { useCallback, useState } from "react";

const STORAGE_KEY = "wiki-tree-open";

function readFromStorage(): Set<number> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<number>(parsed);
  } catch {
    // ignore malformed data
  }
  return new Set();
}

function writeToStorage(ids: Set<number>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore quota errors
  }
}

interface WikiTreeState {
  isOpen: (id: number) => boolean;
  toggle: (id: number) => void;
  openAll: (ids: number[]) => void;
}

/**
 * Хук для сохранения состояния раскрытых папок вики.
 * Состояние хранится в sessionStorage — сохраняется при навигации внутри вкладки,
 * сбрасывается при закрытии вкладки.
 *
 * @param defaultOpenIds - id категорий, которые открыты по умолчанию (при первом визите)
 */
export function useWikiTreeState(defaultOpenIds: number[] = []): WikiTreeState {
  const [openIds, setOpenIds] = useState<Set<number>>(() => {
    const stored = readFromStorage();
    if (stored.size > 0) return stored;
    // Первый визит — открываем по умолчанию
    const defaults = new Set<number>(defaultOpenIds);
    writeToStorage(defaults);
    return defaults;
  });

  const isOpen = useCallback((id: number) => openIds.has(id), [openIds]);

  const toggle = useCallback((id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      writeToStorage(next);
      return next;
    });
  }, []);

  const openAll = useCallback((ids: number[]) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      writeToStorage(next);
      return next;
    });
  }, []);

  return { isOpen, toggle, openAll };
}
