"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  X,
  FileText,
  Layout,
  Briefcase,
  Building2,
  Wrench,
  CornerDownLeft,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardSearch } from "@/features/dashboard/context/DashboardSearchContext";

interface SearchData {
  resumes: { id: string; title: string; template: string; ats_score: number | null }[];
  templates: { id: string; name: string; category: string }[];
  jobs: { id: string; company: string; role: string; status: string }[];
  companies: { name: string }[];
  skills: { name: string }[];
}

type SectionKey = "resumes" | "templates" | "jobs" | "companies" | "skills";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; iconColor: string }[] = [
  { key: "resumes", label: "Resumes", icon: FileText, iconColor: "text-blue-600 bg-blue-50" },
  { key: "templates", label: "Templates", icon: Layout, iconColor: "text-purple-600 bg-purple-50" },
  { key: "jobs", label: "Jobs", icon: Briefcase, iconColor: "text-emerald-600 bg-emerald-50" },
  { key: "companies", label: "Companies", icon: Building2, iconColor: "text-amber-600 bg-amber-50" },
  { key: "skills", label: "Skills", icon: Wrench, iconColor: "text-pink-600 bg-pink-50" },
];

const EMPTY_DATA: SearchData = { resumes: [], templates: [], jobs: [], companies: [], skills: [] };

interface FlatItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

function SectionList({
  section,
  items,
  onSelect,
  highlightIndex,
  setHighlightIndex,
}: {
  section: (typeof SECTIONS)[number];
  items: FlatItem[];
  onSelect: (href: string) => void;
  highlightIndex: number | null;
  setHighlightIndex: (i: number | null) => void;
}) {
  const Icon = section.icon;
  return (
    <div className="py-1.5">
      <div className="flex items-center gap-1.5 px-3 pb-1">
        <span className={cn("w-4 h-4 rounded flex items-center justify-center", section.iconColor)}>
          <Icon className="w-2.5 h-2.5" />
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">{section.label}</h4>
      </div>
      {items.map((item, i) => {
        const isHighlighted = highlightIndex === i;
        return (
          <button
            key={`${section.key}-${item.id}`}
            onMouseEnter={() => setHighlightIndex(i)}
            onClick={() => onSelect(item.href)}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors",
              isHighlighted ? "bg-accent-50/70" : "hover:bg-gray-50"
            )}
          >
            <span className="flex-1 min-w-0">
              <span className={cn("block text-[13px] font-semibold truncate", isHighlighted ? "text-accent-700" : "text-gray-800")}>
                {item.label}
              </span>
              {item.sublabel && (
                <span className="block text-[11px] text-gray-400 truncate">{item.sublabel}</span>
              )}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const { query: contextQuery, setQuery: setContextQuery } = useDashboardSearch();

  const [localQuery, setLocalQuery] = useState("");
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [highlight, setHighlight] = useState<Record<SectionKey, number | null>>({
    resumes: null,
    templates: null,
    jobs: null,
    companies: null,
    skills: null,
  });
  const [debounced, setDebounced] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // On the dashboard the navbar search also filters the resume grid (existing UX)
  const query = isDashboard ? contextQuery : localQuery;

  const setQuery = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (isDashboard) setContextQuery(value);
    },
    [isDashboard, setContextQuery]
  );

  // Debounce the query before hitting the API
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (!debounced) {
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setData(json.data);
          setHighlight({ resumes: null, templates: null, jobs: null, companies: null, skills: null });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debounced]);

  // Close desktop dropdown on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const hasQuery = query.trim().length > 0;
  const showPanel = open && hasQuery;

  const flattenSection = useCallback(
    (key: SectionKey): FlatItem[] => {
      switch (key) {
        case "resumes":
          return data.resumes.map((r) => ({
            id: r.id,
            label: r.title,
            sublabel: r.ats_score !== null ? `ATS ${r.ats_score}/100` : "Resume",
            href: `/builder/${r.id}`,
          }));
        case "templates":
          return data.templates.map((t) => ({
            id: t.id,
            label: t.name,
            sublabel: t.category,
            href: "/templates",
          }));
        case "jobs":
          return data.jobs.map((j) => ({
            id: j.id,
            label: j.role,
            sublabel: `${j.company} · ${j.status}`,
            href: "/jobs",
          }));
        case "companies":
          return data.companies.map((c) => ({ id: c.name, label: c.name, sublabel: "Company", href: "/jobs" }));
        case "skills":
          return data.skills.map((s) => ({ id: s.name, label: s.name, sublabel: "Skill", href: "/dashboard" }));
        default:
          return [];
      }
    },
    [data]
  );

  const firstResultHref = useCallback((): string | null => {
    for (const section of SECTIONS) {
      const items = flattenSection(section.key);
      if (items.length > 0) return items[0].href;
    }
    return null;
  }, [flattenSection]);

  const totalResults =
    data.resumes.length + data.templates.length + data.jobs.length +
    data.companies.length + data.skills.length;

  function handleSelect(href: string) {
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    setDebounced("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const href = firstResultHref();
      if (href) handleSelect(href);
    }
  }

  const renderResults = () => {
    if (!hasQuery) return null;

    if (loading && totalResults === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-xs">Searching…</span>
        </div>
      );
    }

    if (totalResults === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Search className="w-5 h-5 text-gray-200 mb-2" />
          <p className="text-sm font-semibold text-gray-600">No results for “{query.trim()}”</p>
          <p className="text-xs text-gray-400 mt-1">Try searching resumes, templates, jobs, companies, or skills.</p>
        </div>
      );
    }

    return (
      <div>
        {SECTIONS.map((section) => {
          const items = flattenSection(section.key);
          if (items.length === 0) return null;
          return (
            <SectionList
              key={section.key}
              section={section}
              items={items}
              onSelect={handleSelect}
              highlightIndex={highlight[section.key]}
              setHighlightIndex={(i) =>
                setHighlight((prev) => ({ ...prev, [section.key]: i }))
              }
            />
          );
        })}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 font-mono">↵</kbd>
            Open first result
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 font-mono">esc</kbd>
            Close
          </span>
        </div>
      </div>
    );
  };

  const desktopPanel = (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
      <div className="max-h-[min(28rem,70vh)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
        {renderResults()}
      </div>
    </div>
  );

  const mobileOverlay = mobileOpen ? (
    <div className="fixed inset-0 z-[80] sm:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      <div className="absolute inset-x-0 top-0 bg-white shadow-xl rounded-b-3xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search resumes, templates, jobs…"
              aria-label="Global search"
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 focus:bg-white"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 px-2 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
        <div className="max-h-[min(70vh,40rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
          {renderResults()}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Inline search input — hidden on phones (icon + overlay instead) */}
      <div ref={containerRef} className={cn("relative hidden sm:block", className)}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search resumes, templates, jobs…"
            aria-label="Global search"
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 bg-white/90 shadow-sm text-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-300">
              <CornerDownLeft className="w-3 h-3" />
            </span>
          )}
        </div>
        {showPanel && desktopPanel}
      </div>

      {/* Mobile search trigger (icon in navbar) */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Search"
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 active:scale-[0.93]"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {mobileOverlay}
    </>
  );
}
