"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "resumeai-theme";

interface ThemeContextValue {
  theme: Theme;
  /** Sets the theme explicitly (overrides system preference until changed). */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Inline script injected into <head> so the theme is applied before first
 * paint (no flash of the wrong theme). Reads localStorage first, falls back
 * to the OS preference via matchMedia.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var el=document.documentElement;if(d){el.classList.add("dark")}else{el.classList.remove("dark")}}catch(e){}})();`;

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable (privacy mode) — fall through to system.
  }
  return null;
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize once on mount (after the inline script ran) so React state
  // matches what the classList already has.
  useEffect(() => {
    setThemeState(readStoredTheme() ?? systemTheme());
  }, []);

  // Keep <html class="dark"> and localStorage in sync with state.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore — storage unavailable
    }
  }, [theme]);

  // Follow OS theme changes when the user has no explicit preference.
  useEffect(() => {
    if (readStoredTheme()) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setThemeState(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /**
   * Adds a short-lived class to <html> so colors cross-fade smoothly when the
   * user manually switches themes (skipped on first paint / system changes,
   * where an instant flip avoids jank).
   */
  const animateThemeSwitch = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      animateThemeSwitch();
      setThemeState(next);
    },
    [animateThemeSwitch]
  );
  const toggleTheme = useCallback(() => {
    animateThemeSwitch();
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, [animateThemeSwitch]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
