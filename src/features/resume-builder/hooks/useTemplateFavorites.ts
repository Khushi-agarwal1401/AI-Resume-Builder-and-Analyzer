"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "template-favorites";

/**
 * Favorites persisted to localStorage (SSR-safe). Keys are stable kebab-case
 * template keys (e.g. "modern", "ats-professional"). The hook is deliberately
 * small and framework-free so the templates page can share it.
 */
export function useTemplateFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed.filter((k) => typeof k === "string"));
        }
      }
    } catch {
      // Corrupt or unavailable storage — start empty
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode etc.) — state still works for the session
    }
  }, []);

  const toggleFavorite = useCallback(
    (key: string) => {
      setFavorites((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const clearFavorites = useCallback(() => persist([]), [persist]);

  return {
    favorites,
    isFavorite: useCallback((key: string) => favorites.includes(key), [favorites]),
    toggleFavorite,
    clearFavorites,
  };
}
