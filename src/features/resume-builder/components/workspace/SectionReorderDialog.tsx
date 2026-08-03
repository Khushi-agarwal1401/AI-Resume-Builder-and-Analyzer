"use client";

import { useEffect, useState } from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  RotateCcw,
  Lock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "./SectionNavList";
import type { ResumeSectionConfig } from "@/features/resume-builder/config/resume-types";
import { Button } from "@/components/ui/Button";

interface SectionReorderDialogProps {
  open: boolean;
  /** Sections in the current effective order (see getOrderedSections). */
  sections: ResumeSectionConfig[];
  /** The resume type's default section order — used by "Reset to default". */
  defaultSections: ResumeSectionConfig[];
  onClose: () => void;
  /** Emits the new full section order (personal info stays pinned first). */
  onChange: (sectionOrder: string[]) => void;
}

const LOCKED_NOTE =
  "Your name & contact info are always shown first — they anchor the resume header.";

/**
 * Drag-to-reorder dialog for resume sections (bonus feature).
 * - Personal info is pinned at the top and can't be moved.
 * - HTML5 drag & drop plus accessible up/down buttons.
 * - "Reset to default" restores the order defined by the resume type.
 * Every change is emitted immediately so the autosave + live preview stay in sync.
 */
export function SectionReorderDialog({
  open,
  sections,
  defaultSections,
  onClose,
  onChange,
}: SectionReorderDialogProps) {
  const [items, setItems] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync the working list whenever the dialog opens or the effective order changes.
  useEffect(() => {
    if (open) setItems(sections.map((s) => s.id));
  }, [open, sections]);

  // Close on Escape (matches the ConfirmDialog pattern).
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const pinned = sections[0];
  const movable = sections.slice(1);

  function emit(order: string[]) {
    onChange(order);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    emit(next);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItems(next);
    emit(next);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleReset() {
    setItems(defaultSections.map((s) => s.id));
    emit([]);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Arrange sections"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Arrange Sections</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag to reorder — the builder, navigation and flexible templates follow this order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Locked personal info */}
        {pinned && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
              <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <SectionRowIcon id={pinned.id} className="text-gray-400" />
              <span className="text-[13px] font-semibold text-gray-600 truncate">{pinned.label}</span>
              <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
                Locked
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              {LOCKED_NOTE}
            </p>
          </div>
        )}

        {/* Draggable list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
          <div role="list" aria-label="Reorderable sections" className="space-y-1.5">
            {movable.map((section, index) => {
              const itemIndex = index + 1; // offset by pinned row
              const isDragging = dragIndex === itemIndex;
              const isDragOver = dragOverIndex === itemIndex;
              return (
                <div
                  key={section.id}
                  role="listitem"
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(itemIndex);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverIndex !== itemIndex) setDragOverIndex(itemIndex);
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === itemIndex) setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(itemIndex);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing",
                    isDragging
                      ? "border-accent-400 bg-accent-50 opacity-60 shadow-md"
                      : isDragOver
                        ? "border-accent-300 bg-accent-50/60 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" />
                  <SectionRowIcon id={section.id} className="text-gray-500 shrink-0" />
                  <span className="text-[13px] font-medium text-gray-700 truncate flex-1">
                    {section.label}
                  </span>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => move(itemIndex, -1)}
                      disabled={index === 0}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      aria-label={`Move ${section.label} up`}
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(itemIndex, 1)}
                      disabled={index === movable.length - 1}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      aria-label={`Move ${section.label} down`}
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to default
          </button>
          <Button size="sm" onClick={onClose} className="text-white">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionRowIcon({ id, className }: { id: string; className?: string }) {
  const Icon = SECTION_ICONS[id] || null;
  if (!Icon) return null;
  return <Icon size={15} className={className} />;
}
