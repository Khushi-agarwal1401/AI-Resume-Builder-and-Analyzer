"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ResumeData } from "@/types/resume";

export type AiHistoryType = "summary" | "experience";

export interface AiHistoryEntry {
  id: string;
  type: AiHistoryType;
  description: string;
  originalContent: string | ResumeData["experience"];
  newContent: string | ResumeData["experience"];
  timestamp: number;
}

interface AiHistoryContextType {
  history: AiHistoryEntry[];
  addHistory: (entry: Omit<AiHistoryEntry, "id" | "timestamp">) => void;
  undoLast: () => AiHistoryEntry | null;
  clearHistory: () => void;
}

const AiHistoryContext = createContext<AiHistoryContextType | undefined>(undefined);

export function AiHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<AiHistoryEntry[]>([]);

  const addHistory = useCallback((entry: Omit<AiHistoryEntry, "id" | "timestamp">) => {
    const newEntry: AiHistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newEntry, ...prev]);
  }, []);

  const undoLast = useCallback(() => {
    if (history.length === 0) return null;
    const lastEntry = history[0];
    setHistory((prev) => prev.slice(1));
    return lastEntry;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <AiHistoryContext.Provider value={{ history, addHistory, undoLast, clearHistory }}>
      {children}
    </AiHistoryContext.Provider>
  );
}

export function useAiHistory() {
  const context = useContext(AiHistoryContext);
  if (!context) {
    throw new Error("useAiHistory must be used within an AiHistoryProvider");
  }
  return context;
}
