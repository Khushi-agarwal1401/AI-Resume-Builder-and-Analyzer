"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SectionEmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
}

/**
 * Premium dashed empty state for builder sections — an inviting alternative
 * to a bare "no items" message. Replaces blank-page anxiety with a single,
 * obvious next action.
 */
export function SectionEmptyState({
  icon: Icon,
  title,
  description,
  addLabel,
  onAdd,
}: SectionEmptyStateProps) {
  return (
    <div className="group flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 transition-colors duration-200 hover:border-accent-300 hover:bg-accent-50/30">
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
        <Icon className="w-6 h-6 text-accent-600" />
      </div>
      <h4 className="text-base font-bold text-gray-900">{title}</h4>
      <p className="text-[13px] text-gray-500 max-w-xs mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      <Button variant="secondary" size="sm" onClick={onAdd} className="gap-1.5">
        <Plus className="w-4 h-4" /> {addLabel}
      </Button>
    </div>
  );
}
