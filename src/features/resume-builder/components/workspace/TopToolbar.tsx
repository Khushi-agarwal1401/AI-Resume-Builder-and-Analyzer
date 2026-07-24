import React from "react";
import { ArrowLeft, Undo, Redo, Share2, Download, Cloud, CloudOff, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
        <div className="relative group hidden lg:block">
          <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-100">
            <LayoutTemplate className="w-4 h-4" />
            <span className="capitalize">{template}</span>
          </Button>
          <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2">
            {["modern", "ats-professional", "student", "minimal"].map((t) => (
              <button
                key={t}
                onClick={() => onChangeTemplate(t)}
                className={`w-full text-left px-4 py-2.5 text-sm capitalize hover:bg-gray-50 transition-colors ${t === template ? 'font-semibold text-primary-600 bg-primary-50' : 'text-gray-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
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
