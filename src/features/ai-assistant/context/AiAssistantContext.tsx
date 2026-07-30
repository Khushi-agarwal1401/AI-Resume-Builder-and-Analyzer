"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type AiTab =
  | "summary"
  | "bullets"
  | "grammar"
  | "achievements"
  | "summary-improve"
  | "bullet-improve"
  | "actions"
  | "metrics"
  | "weak"
  | "rewrite"
  | "ats";

interface AiAssistantContextType {
  isOpen: boolean;
  floatingMode: boolean;
  activeTab: AiTab;
  initialInput: string;
  contextInput: string;
  openAssistant: (tab: AiTab, input?: string, context?: string) => void;
  openFloatingAssistant: (tab: AiTab, input?: string, context?: string) => void;
  closeAssistant: () => void;
  setActiveTab: (tab: AiTab) => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [floatingMode, setFloatingMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AiTab>("summary");
  const [initialInput, setInitialInput] = useState("");
  const [contextInput, setContextInput] = useState("");

  const openAssistant = useCallback((tab: AiTab, input = "", context = "") => {
    setActiveTab(tab);
    setInitialInput(input);
    setContextInput(context);
    setFloatingMode(false);
    setIsOpen(true);
  }, []);

  const openFloatingAssistant = useCallback((tab: AiTab, input = "", context = "") => {
    setActiveTab(tab);
    setInitialInput(input);
    setContextInput(context);
    setFloatingMode(true);
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setFloatingMode(false);
  }, []);

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        floatingMode,
        activeTab,
        initialInput,
        contextInput,
        openAssistant,
        openFloatingAssistant,
        closeAssistant,
        setActiveTab,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
}
