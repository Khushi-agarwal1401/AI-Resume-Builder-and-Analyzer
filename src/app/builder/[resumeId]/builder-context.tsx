"use client";

import { createContext, useContext } from "react";
import type { ResumeData } from "@/types/resume";

export interface BuilderContextValue {
  data: ResumeData | null;
  setData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  sectionIds: string[];
  currentSectionIndex: number;
  debouncedData: ResumeData | null;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  resumeId: string;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderLayout");
  return ctx;
}
