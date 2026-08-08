"use client";

import { FileText } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

interface Props {
  data: string;
  onChange: (data: string) => void;
}

export function SummarySection({ data, onChange }: Props) {
  return (
    <SectionCard id="summary" title="Professional Summary" icon={FileText}>
      <textarea
        aria-label="Professional summary"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 min-h-[120px] resize-y transition-all"
        value={data}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a brief professional summary describing your experience, core skills, and goals..."
      />
    </SectionCard>
  );
}
