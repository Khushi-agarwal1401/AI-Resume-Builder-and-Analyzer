import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Undo, Redo, Share2, Download, Cloud, CloudOff, LayoutTemplate, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TEMPLATE_BADGE, TEMPLATE_NAMES, TEMPLATE_VARIANTS, TEMPLATE_LAYOUT, LAYOUT_BADGE } from "@/features/resume-builder/config/template-constants";
import { TemplateMiniPreview } from "@/features/resume-builder/components/TemplateMiniPreview";

interface TopToolbarProps {
  title: string;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onExport: () => void;
  onShare: () => void;
  onAtsScore: () => void;
  template: string;
  onChangeTemplate: (template: string) => void;
}

export function TopToolbar({
  title,
  saving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  onExport,
  onShare,
  onAtsScore,
  template,
  onChangeTemplate,
}: TopToolbarProps) {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badge = TEMPLATE_BADGE[template];

  return (
    <div className="h-16 px-5 flex items-center justify-between w-full border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 shrink-0 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block" />

        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px] xl:max-w-[300px]">
            {title}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {saving ? (
              <>
                <Cloud className="w-3 h-3 text-primary-500" /> Saving...
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3" /> Saved to cloud
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 flex-1">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-gray-600 disabled:opacity-30 hover:bg-gray-100"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-2 text-gray-600 disabled:opacity-30 hover:bg-gray-100"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2 flex-1">
        {/* Template selector with thumbnails */}
        <div className="relative hidden lg:block" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
            className="gap-1.5 hover:bg-gray-100"
          >
            <LayoutTemplate className="w-4 h-4 text-gray-500" />
            {badge ? (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                badge.bg,
                badge.text
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                {TEMPLATE_NAMES[template as keyof typeof TEMPLATE_NAMES] || template}
              </span>
            ) : (
              <span className="capitalize text-xs text-gray-600">{template}</span>
            )}
            <ChevronDown size={13} className={cn("text-gray-400 transition-transform", templateMenuOpen && "rotate-180")} />
          </Button>

          {templateMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                Switch template
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_VARIANTS.map((t) => {
                  const tBadge = TEMPLATE_BADGE[t];
                  const isActive = template === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        onChangeTemplate(t);
                        setTemplateMenuOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-stretch rounded-lg transition-all duration-150 overflow-hidden group",
                        isActive
                          ? "ring-2 ring-accent-500 ring-offset-1 shadow-sm"
                          : "hover:ring-2 hover:ring-gray-200 hover:ring-offset-1 hover:shadow-sm"
                      )}
                    >
                      {/* Mini preview thumbnail */}
                      <div className={cn(
                        "h-[80px] relative overflow-hidden flex items-center justify-center",
                        tBadge?.bg || "bg-gray-100"
                      )}>
                        <div className="absolute inset-1.5 bg-white rounded shadow-sm overflow-hidden">
                          <TemplateMiniPreview templateId={t} className="h-full" />
                        </div>
                        {isActive && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm">
                            <Check size={9} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      {/* Template name + layout badge */}
                      <div className={cn(
                        "flex items-center justify-between gap-1 px-2 py-1.5 transition-colors",
                        isActive
                          ? "text-accent-700 bg-accent-50"
                          : "text-gray-700 bg-white"
                      )}>
                        <span className="text-[11px] font-semibold truncate group-hover:text-gray-900">
                          {TEMPLATE_NAMES[t]}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[t]]?.bg || "bg-gray-100",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[t]]?.text || "text-gray-500"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            LAYOUT_BADGE[TEMPLATE_LAYOUT[t]]?.dot || "bg-gray-400"
                          )} />
                          {LAYOUT_BADGE[TEMPLATE_LAYOUT[t]]?.label || "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Button variant="secondary" size="sm" onClick={onAtsScore} className="hidden md:flex">
          ATS Score
        </Button>
        <Button variant="secondary" size="sm" onClick={onShare} className="hidden sm:flex">
          <Share2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Share</span>
        </Button>
        <Button size="sm" onClick={onExport}>
          <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </div>
    </div>
  );
}
