"use client";

import React, { createContext, useContext, useState } from "react";

export type AiTab =
  | "summary"
  | "summary-improve"
  | "bullets"
  | "bullet-improve"
  | "actions"
  | "metrics"
  | "weak"
  | "grammar"
  | "achievements"
  | "rewrite"
  | "ats";

interface AiAssistantContextType {
  isOpen: boolean;
  activeTab: AiTab;
  initialInput: string;
  contextInput: string; // for role/company context
  openAssistant: (tab: AiTab, input?: string, context?: string) => void;
  closeAssistant: () => void;
  setActiveTab: (tab: AiTab) => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AiTab>("summary");
  const [initialInput, setInitialInput] = useState("");
  const [contextInput, setContextInput] = useState("");

  const openAssistant = (tab: AiTab, input = "", context = "") => {
    setActiveTab(tab);
    setInitialInput(input);
    setContextInput(context);
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
  };

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        activeTab,
        initialInput,
        contextInput,
        openAssistant,
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
