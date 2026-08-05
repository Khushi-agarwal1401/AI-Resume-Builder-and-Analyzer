"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  /** Compact icon-only variant for toolbars/navbars. */
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95",
        compact ? "w-9 h-9" : "w-10 h-10",
        "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
        className
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
