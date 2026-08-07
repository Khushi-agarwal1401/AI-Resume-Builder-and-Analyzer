"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Plus,
  Target,
  Download,
  Sparkles,
  Crosshair,
  Settings,
  LayoutDashboard,
  Layout,
  Bell,
  BarChart3,
  Briefcase,
  FileText,
  CornerDownLeft,
  Command,
} from "lucide-react";

interface CommandItem {
  id: string;
  group: "Actions" | "Navigate";
  label: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  run: () => void | Promise<void>;
}

/** Highlight every (case-insensitive) occurrence of `query` inside `text`. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q || !text.toLowerCase().includes(q)) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let i = 0;
  const lower = text.toLowerCase();
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="rounded-[3px] px-0.5 -mx-0.5 bg-amber-100 text-amber-900">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

/** Global command palette (Epic 13) — Ctrl/Cmd+K (or Ctrl/Cmd+/) from anywhere. */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, loading: authLoading } = useAuth();
  const isLandingPage = pathname === "/";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Command definitions ────────────────────────────────────────────────
  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "create-resume",
        group: "Actions" as const,
        label: "Create Resume",
        keywords: ["new", "resume", "builder", "start"],
        icon: Plus,
        iconClass: "bg-blue-50 text-blue-600",
        run: async () => {
          try {
            const res = await fetch("/api/resumes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "Untitled Resume",
                targetLevel: "fresher",
                template: "modern",
              }),
            });
            const json = await res.json();
            if (json.success) {
              toast.success("Resume created");
              router.push(`/builder/${json.data.id}`);
            } else {
              toast.error(json.error || "Could not create resume.");
            }
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
        },
      },
      {
        id: "ats-check",
        group: "Actions" as const,
        label: "ATS Check",
        keywords: ["ats", "score", "analysis", "check"],
        icon: Target,
        iconClass: "bg-purple-50 text-purple-600",
        run: () => router.push("/ats-check"),
      },
      {
        id: "export",
        group: "Actions" as const,
        label: "Export",
        keywords: ["download", "pdf", "docx", "export"],
        icon: Download,
        iconClass: "bg-blue-50 text-blue-600",
        run: async () => {
          try {
            const res = await fetch("/api/resumes");
            const json = await res.json();
            const resumes = json?.data ?? [];
            // Open the most recently updated resume's preview (has the Download button).
            router.push(resumes.length > 0 ? `/preview/${resumes[0].id}` : "/dashboard");
          } catch {
            router.push("/dashboard");
          }
        },
      },
      {
        id: "ai-assistant",
        group: "Actions" as const,
        label: "AI Assistant",
        keywords: ["ai", "assistant", "generate", "polish", "rewrite"],
        icon: Sparkles,
        iconClass: "bg-indigo-50 text-indigo-600",
        run: () => router.push("/tools/application-kit"),
      },
      {
        id: "job-match",
        group: "Actions" as const,
        label: "Job Match",
        keywords: ["job", "match", "jd", "description", "analyze"],
        icon: Crosshair,
        iconClass: "bg-emerald-50 text-emerald-600",
        run: () => router.push("/tools/job-match"),
      },
      {
        id: "settings",
        group: "Actions" as const,
        label: "Settings",
        keywords: ["settings", "profile", "account", "preferences"],
        icon: Settings,
        iconClass: "bg-slate-50 text-slate-600",
        run: () => router.push("/settings"),
      },
      // ── Navigation shortcuts ──
      {
        id: "dashboard",
        group: "Navigate" as const,
        label: "Dashboard",
        keywords: ["home", "resumes", "overview"],
        icon: LayoutDashboard,
        iconClass: "bg-gray-50 text-gray-600",
        run: () => router.push("/dashboard"),
      },
      {
        id: "templates",
        group: "Navigate" as const,
        label: "Templates",
        keywords: ["template", "gallery", "design", "layout"],
        icon: Layout,
        iconClass: "bg-purple-50 text-purple-600",
        run: () => router.push("/templates"),
      },
      {
        id: "notifications",
        group: "Navigate" as const,
        label: "Notifications",
        keywords: ["bell", "alerts", "activity"],
        icon: Bell,
        iconClass: "bg-red-50 text-red-500",
        run: () => router.push("/notifications"),
      },
      {
        id: "analytics",
        group: "Navigate" as const,
        label: "Analytics",
        keywords: ["trend", "stats", "score trend", "charts"],
        icon: BarChart3,
        iconClass: "bg-teal-50 text-teal-600",
        run: () => router.push("/analytics"),
      },
      {
        id: "job-tracker",
        group: "Navigate" as const,
        label: "Job Tracker",
        keywords: ["jobs", "applications", "tracker"],
        icon: Briefcase,
        iconClass: "bg-emerald-50 text-emerald-600",
        run: () => router.push("/jobs"),
      },
      {
        id: "cover-letter",
        group: "Navigate" as const,
        label: "Cover Letter",
        keywords: ["cover letter", "letter", "write"],
        icon: FileText,
        iconClass: "bg-amber-50 text-amber-600",
        run: () => router.push("/tools/cover-letter"),
      },
    ],
    [router]
  );

  // Filter commands by the query (label + keywords, case-insensitive substring).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q))
    );
  }, [commands, query]);

  // Reset selection whenever the filtered list changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // ── Global shortcut: Ctrl/Cmd+K (and Ctrl/Cmd+/) toggles the palette ───
  useEffect(() => {
    if (!authenticated || isLandingPage || authLoading) return;
    function handleShortcut(e: KeyboardEvent) {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && (e.key.toLowerCase() === "k" || e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [authenticated, isLandingPage, authLoading]);

  // Focus the input whenever the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Keep the active row scrolled into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Trap Tab focus inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;
    const dialog = listRef.current?.closest<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>('input, button, [href], [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute("disabled"));
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  const runCommand = useCallback(
    (command: CommandItem) => {
      setOpen(false);
      void command.run();
    },
    []
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = filtered[activeIndex];
      if (command) runCommand(command);
    }
  }

  if (!authenticated || isLandingPage) return null;

  const groups = ["Actions", "Navigate"] as const;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4",
        !open && "pointer-events-none invisible"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          "relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-150",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search…"
            aria-label="Command palette search"
            className="flex-1 h-14 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono shrink-0">
              <Command className="w-3 h-3" />K
            </kbd>
          )}
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-[min(24rem,60vh)] overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-5 h-5 text-gray-200 mb-2" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No commands found</p>
              <p className="text-xs text-gray-400 mt-1">Try “Create Resume”, “ATS Check”, or “Settings”.</p>
            </div>
          ) : (
            groups.map((group) => {
              const items = filtered.filter((c) => c.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="py-1">
                  <h4 className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                    {group}
                  </h4>
                  {items.map((command) => {
                    const flatIndex = filtered.indexOf(command);
                    const isActive = flatIndex === activeIndex;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        data-index={flatIndex}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => runCommand(command)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isActive ? "bg-accent-50/70 dark:bg-accent-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        )}
                      >
                        <span
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            command.iconClass
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "block text-[13px] font-semibold truncate",
                              isActive ? "text-accent-700 dark:text-accent-300" : "text-gray-800 dark:text-gray-200"
                            )}
                          >
                            <Highlighted text={command.label} query={query} />
                          </span>
                        </span>
                        <CornerDownLeft
                          className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            isActive ? "text-accent-400" : "text-gray-200 dark:text-gray-700"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">↑↓</kbd>
            Navigate
            <kbd className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">↵</kbd>
            Select
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
