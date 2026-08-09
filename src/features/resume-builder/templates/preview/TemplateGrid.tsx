"use client";

import type { ResumeData } from "@/types/resume";
import { TemplateCard } from "./TemplateCard";

interface TemplateGridProps {
  templateIds: string[];
  resume: ResumeData;
  selectedId?: string | null;
  busyId?: string | null;
  onSelect?: (id: string) => void;
  onPreview?: (id: string) => void;
  onUse?: (id: string) => void;
}

/**
 * Responsive template grid: 4 columns on desktop, 2 on tablet, 1 on mobile.
 * Each cell renders a real scaled resume via <TemplateCard />.
 */
export function TemplateGrid({
  templateIds,
  resume,
  selectedId = null,
  busyId = null,
  onSelect,
  onPreview,
  onUse,
}: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templateIds.map((id) => (
        <TemplateCard
          key={id}
          templateId={id}
          resume={resume}
          selected={selectedId === id}
          busy={busyId === id}
          onSelect={onSelect}
          onPreview={onPreview}
          onUse={onUse}
        />
      ))}
    </div>
  );
}
