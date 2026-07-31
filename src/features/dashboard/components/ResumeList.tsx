import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, MoreVertical, Edit3, Copy, Download, Trash, Palette, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TEMPLATE_DISPLAY, TEMPLATE_BADGE } from "@/features/resume-builder/config/template-constants";

export interface ResumeListItem {
  id: string;
  title: string;
  template: string;
  created_at: string;
  updated_at: string;
}

interface ResumeListProps {
  resumes: ResumeListItem[];
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
  onSaveTitle: (id: string, newTitle: string) => void;
  onChangeTemplate: (id: string, newTemplate: string) => void;
}

export function ResumeList({
  resumes,
  onCreate,
  onDelete,
  onDuplicate,
  onDownload,
  onSaveTitle,
  onChangeTemplate,
}: ResumeListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [templatePickerId, setTemplatePickerId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const templatePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
        setTemplatePickerId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveTitleInternal = (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    onSaveTitle(id, editTitle);
    setEditingId(null);
  };

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-300 rounded-2xl bg-white shadow-md w-full">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 mb-6 shadow-sm">
          <FileText className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Create your first resume</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm text-sm">
          Get started by building a professional, ATS-friendly resume powered by AI.
        </p>
        <Button onClick={onCreate} size="lg" className="gap-2">
          <Plus className="w-5 h-5" /> Create Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {resumes.map((r) => (
        <div
          key={r.id}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
        >
          {/* Thumbnail Header */}
          <div
            className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-center relative cursor-pointer"
            onClick={() => router.push(`/builder/${r.id}`)}
          >
            <div className="w-24 h-32 bg-white border border-gray-200 shadow-md rounded-lg p-3 flex flex-col gap-2">
              <div className="h-1.5 w-full bg-gray-300 rounded-full" />
              <div className="h-1.5 w-3/4 bg-gray-200 rounded-full" />
              <div className="h-1.5 w-full bg-gray-200 rounded-full" />
              <div className="h-1.5 w-5/6 bg-gray-200 rounded-full" />
            </div>
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg">
                Open Builder
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2 relative">
              {editingId === r.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveTitleInternal(r.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitleInternal(r.id)}
                  className="text-lg font-bold text-gray-900 border-b-2 border-primary-500 outline-none w-full bg-transparent"
                />
              ) : (
                <h3
                  className="text-lg font-bold text-gray-900 truncate flex-1 group-hover:text-primary-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setEditTitle(r.title);
                    setEditingId(r.id);
                  }}
                >
                  {r.title}
                </h3>
              )}

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === r.id ? null : r.id);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-lg transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpenId === r.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-10"
                  >
                    <button
                      onClick={() => {
                        setEditTitle(r.title);
                        setEditingId(r.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpenId(null);
                        onDuplicate(r.id);
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpenId(null);
                        onDownload(r.id);
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <div className="h-px bg-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setMenuOpenId(null);
                        onDelete(r.id);
                      }}
                      className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none flex items-center gap-3 transition-colors"
                    >
                      <Trash className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTemplatePickerId(templatePickerId === r.id ? null : r.id);
                  setMenuOpenId(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95",
                  TEMPLATE_BADGE[r.template]?.bg || "bg-gray-100",
                  TEMPLATE_BADGE[r.template]?.text || "text-gray-600"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", TEMPLATE_BADGE[r.template]?.dot || "bg-gray-400")} />
                <Palette className="w-3 h-3 opacity-70" />
                {TEMPLATE_DISPLAY[r.template] || r.template}
                <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", templatePickerId === r.id && "rotate-180")} />
              </button>

              {/* Template picker dropdown */}
              {templatePickerId === r.id && (
                <div
                  ref={templatePickerRef}
                  className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-[220px] grid grid-cols-2 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(TEMPLATE_DISPLAY).map(([key, label]) => {
                    const badge = TEMPLATE_BADGE[key];
                    const isActive = r.template === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setTemplatePickerId(null);
                          onChangeTemplate(r.id, key);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left",
                          isActive
                            ? "ring-2 ring-offset-1 ring-gray-300"
                            : "hover:bg-gray-50",
                          badge?.bg,
                          badge?.text || "text-gray-600"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", badge?.dot || "bg-gray-400")} />
                        <span className="flex-1 truncate">{label}</span>
                        {isActive && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Edited {new Date(r.updated_at).toLocaleDateString()}</span>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/builder/${r.id}`);
                }}
                variant="secondary"
                size="sm"
                className="gap-2 flex items-center focus:ring-2 focus:ring-black focus:ring-offset-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Resume
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
