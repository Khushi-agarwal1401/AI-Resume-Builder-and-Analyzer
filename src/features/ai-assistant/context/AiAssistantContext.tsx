"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AiAssistantContextType {
  isOpen: boolean;
  openAssistant: (section?: string, data?: string) => void;
  closeAssistant: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setActiveSection] = useState<string | undefined>();
  const [, setActiveData] = useState<string | undefined>();

  const openAssistant = (section?: string, data?: string) => {
    setActiveSection(section);
    setActiveData(data);
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
  };

  return (
    <AiAssistantContext.Provider value={{ isOpen, openAssistant, closeAssistant }}>
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (context === undefined) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
}
