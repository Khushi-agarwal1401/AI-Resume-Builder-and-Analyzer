"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import type { AiAction } from "@/types/ai";

interface Suggestion {
  type: string;
  text: string;
}

interface UseAiAssistantReturn {
  loading: boolean;
  error: string | null;
  suggestions: Suggestion[];
  generateSummary: (input: string, context: string) => Promise<string | null>;
  enhanceBullet: (input: string, context: string) => Promise<string | null>;
  checkGrammar: (input: string) => Promise<string | null>;
  suggestAchievements: (input: string, context: string) => Promise<string | null>;
  addKeywords: (input: string, context: string) => Promise<string | null>;
  rewriteSection: (input: string, context: string) => Promise<string | null>;
  clearError: () => void;
}

export function useAiAssistant(): UseAiAssistantReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function executeAction(action: AiAction, input: string, context: string): Promise<string | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await callAi(action, input, context);
      if (res.success) {
        setSuggestions((prev) => [...prev, { type: action, text: res.output }]);
        return res.output;
      } else {
        setError(res.error || `${action} failed`);
        return null;
      }
    } catch {
      setError("AI service unavailable. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  const generateSummary = useCallback(
    (input: string, context: string) => executeAction("generate-summary", input, context),
    []
  );

  const enhanceBullet = useCallback(
    (input: string, context: string) => executeAction("enhance-bullet", input, context),
    []
  );

  const checkGrammar = useCallback(
    (input: string) => executeAction("check-grammar", input, ""),
    []
  );

  const suggestAchievements = useCallback(
    (input: string, context: string) => executeAction("suggest-achievements", input, context),
    []
  );

  const addKeywords = useCallback(
    (input: string, context: string) => executeAction("add-keywords", input, context),
    []
  );

  const rewriteSection = useCallback(
    (input: string, context: string) => executeAction("rewrite-section", input, context),
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    suggestions,
    generateSummary,
    enhanceBullet,
    checkGrammar,
    suggestAchievements,
    addKeywords,
    rewriteSection,
    clearError,
  };
}
