"use client";

import { FileText, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAiAssistant } from "@/features/ai-assistant/context/AiAssistantContext";

interface Props {
  data: string;
  onChange: (data: string) => void;
}

export function SummarySection({ data, onChange }: Props) {
  const { openAssistant } = useAiAssistant();

  return (
    <SectionCard id="summary" title="Professional Summary" icon={FileText}>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => openAssistant("summary", data)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Write with AI
        </button>
      </div>
      <textarea
        aria-label="Professional summary"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[120px] resize-y transition-all"
        value={data}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a brief professional summary describing your experience, core skills, and goals..."
      />
    </SectionCard>
  );
}
