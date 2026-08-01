"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_LAYOUT, LAYOUT_BADGE } from "@/features/resume-builder/config/template-constants";
import {
  TEMPLATE_FILTERS,
  TEMPLATE_SORTS,
  filterTemplates,
  normalizeTemplateKey,
  sortTemplates,
  type TemplateFilterId,
  type TemplateSortId,
} from "@/features/resume-builder/config/template-discovery";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";

// ─── Sample Resume Data (shared for all template previews) ──────────────
const SAMPLE_RESUME: ResumeData = {
  id: "preview", userId: "preview", title: "Sample Resume", template: "modern", targetLevel: "experienced",
  personalInfo: {
    fullName: "Radheshyam Bhati",
    email: "radheshyam@email.com",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/radheshyam",
    github: "github.com/radheshyam",
    portfolio: "radheshyam.dev",
    photo: "",
  },
  summary: "Results-driven Software Engineer with 5+ years building scalable web applications and AI-powered solutions. Passionate about clean architecture and performance optimization.",
  education: [{ id: "edu1", institution: "Stanford University", degree: "B.Tech", field: "Computer Science", startDate: "2021", endDate: "2025", cgpa: "3.8" }],
  experience: [{
    id: "exp1", company: "TechNova Solutions", role: "Senior Software Engineer", location: "San Francisco, CA",
    startDate: "2023", endDate: "2026", current: true,
    responsibilities: [
      "Architected microservices handling 100K+ daily active users",
      "Improved system performance by 40% through query optimization",
      "Led cross-functional team of 6 engineers delivering 3 major releases",
    ],
    achievements: [],
  }],
  projects: [{
    id: "proj1", name: "AI Resume Analyzer", description: "ML-powered resume analysis tool with 94% accuracy.",
    technologies: ["Python", "TensorFlow", "React", "PostgreSQL"], liveUrl: "", githubUrl: "",
  }],
  skills: {
    technical: ["Python", "TypeScript", "Go", "SQL"],
    soft: ["Leadership", "Communication"],
    tools: ["Docker", "Kubernetes", "AWS"],
    frameworks: ["React", "Next.js", "FastAPI"],
  },
  certifications: [{ id: "cert1", name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2024", url: "" }],
  achievements: [{ id: "ach1", title: "Best Engineering Award", description: "Outstanding contribution to platform reliability", date: "2025" }],
  languages: [
    { id: "lang1", name: "English", proficiency: "native" },
    { id: "lang2", name: "Hindi", proficiency: "native" },
  ],
  codingProfiles: [], leadership: [], openSource: [], publications: [], volunteer: [], activities: [], coursework: [],
  interests: ["Machine Learning", "System Design", "Open Source"],
  createdAt: "2024-01-01", updatedAt: "2026-07-01",
};

interface Template {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  popular: boolean;
  gradient: string;
  addedAt?: string;
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    id: "modern",
    key: "modern",
    name: "Modern",
    description: "Clean and balanced layout suitable for most industries. Features a centered header with full contact info, professional summary, experience timeline, and dedicated sections for education, skills, projects, certifications, achievements, and languages.",
    category: "General",
    popular: true,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "ats-professional",
    key: "ats-professional",
    name: "ATS Professional",
    description: "Optimized for Applicant Tracking Systems with a clean single-column structure. Uses section headers with gray backgrounds and a standardized format that parsers handle reliably.",
    category: "ATS-Optimized",
    popular: true,
    gradient: "from-gray-700 to-gray-900",
  },
  {
    id: "student",
    key: "student",
    name: "Student",
    description: "Designed for students and recent graduates with emphasis on education, projects, and certifications. Highlights academic achievements and technical skills prominently.",
    category: "Entry-Level",
    popular: false,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "minimal",
    key: "minimal",
    name: "Minimal",
    description: "A minimalist design with generous whitespace and a clean sans-serif aesthetic. Uses subtle section labels and a light typography hierarchy for a modern, uncluttered look.",
    category: "Design",
    popular: false,
    gradient: "from-gray-400 to-gray-500",
  },
  {
    id: "executive",
    key: "executive",
    name: "Executive",
    description: "A serif-based template with an elegant navy accent. Features an executive summary section, professional experience timeline, and a two-column skills layout. Ideal for senior roles.",
    category: "Executive",
    popular: true,
    gradient: "from-indigo-900 to-indigo-700",
  },
  {
    id: "creative",
    key: "creative",
    name: "Creative",
    description: "A bold, visually-driven layout with a pink sidebar containing skills and contact info. Features timeline-style experience entries with dot indicators and a project card grid. Best for creative roles.",
    category: "Creative",
    popular: false,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "executive-sidebar",
    key: "executive-sidebar",
    name: "Exec Sidebar",
    description: "Two-column layout with a dark sidebar featuring contact, skills, and certifications. Main content area highlights profile summary, experience timeline, education, projects, and achievements. Ideal for senior leadership.",
    category: "Executive",
    popular: true,
    gradient: "from-slate-800 to-slate-900",
  },
  {
    id: "modern-card",
    key: "modern-card",
    name: "Card Modern",
    description: "Rounded card-style sections with indigo accent chips for skills and technologies. Clean border-based layout with subtle shadows, perfect for showcasing projects and certifications in a modern format.",
    category: "General",
    popular: false,
    gradient: "from-indigo-500 to-purple-600",
  },
];

// Maps template component_key/id to display gradient
const GRADIENT_MAP: Record<string, string> = {
  modern: "from-blue-500 to-indigo-600",
  "ats-professional": "from-gray-700 to-gray-900",
  student: "from-green-500 to-emerald-600",
  minimal: "from-gray-400 to-gray-500",
  executive: "from-indigo-900 to-indigo-700",
  creative: "from-pink-500 to-rose-600",
  "executive-sidebar": "from-slate-800 to-slate-900",
  "modern-card": "from-indigo-500 to-purple-600",
};

// Templates considered "popular" from the DB
const POPULAR_IDS = new Set(["modern", "ats-professional", "executive", "executive-sidebar"]);

// Scale factor for template previews in the grid cards
const GRID_PREVIEW_SCALE = 0.38;

// Scale factor for the large detail preview
const DETAIL_PREVIEW_SCALE = 0.55;

/** Map API template row to the display Template shape */
function mapApiTemplate(apiTemplate: {
  id: string;
  name: string;
  category: string;
  description?: string;
  component_key: string;
  created_at?: string;
}): Template {
  const key = normalizeTemplateKey(apiTemplate.component_key);
  return {
    id: apiTemplate.id,
    key,
    name: apiTemplate.name,
    description: apiTemplate.description || "",
    category: apiTemplate.category,
    popular: POPULAR_IDS.has(key),
    gradient: GRADIENT_MAP[key] || "from-gray-500 to-gray-700",
    addedAt: apiTemplate.created_at,
  };
}

/** Renders the template name with the active search query highlighted. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{name}</>;
  const idx = name.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="bg-accent-100 text-accent-700 rounded-sm px-0.5">{name.slice(idx, idx + q.length)}</mark>
      {name.slice(idx + q.length)}
    </>
  );
}

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>("modern");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<TemplateFilterId[]>([]);
  const [sortBy, setSortBy] = useState<TemplateSortId>("popular");

  // Fetch active templates from API; fall back to hardcoded FALLBACK_TEMPLATES on error
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates", { signal: controller.signal });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data.map(mapApiTemplate));
        }
      } catch {
        // Fallback to FALLBACK_TEMPLATES — already set as initial state
      }
    }
    fetchTemplates();

    return () => controller.abort();
  }, []);

  // Filter + sort the visible templates (search, category filters, sorting)
  const visibleTemplates = useMemo(
    () => sortTemplates(filterTemplates(templates, query, activeFilters), sortBy),
    [templates, query, activeFilters, sortBy]
  );

  // Reset selected to first visible template when the current one is filtered out
  useEffect(() => {
    if (visibleTemplates.length > 0 && !visibleTemplates.find((t) => t.id === selectedId)) {
      setSelectedId(visibleTemplates[0].id);
    }
  }, [visibleTemplates, selectedId]);

  const selected = visibleTemplates.find((t) => t.id === selectedId) || visibleTemplates[0];

  function toggleFilter(id: TemplateFilterId) {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function clearAll() {
    setQuery("");
    setActiveFilters([]);
  }

  function targetLevelForTemplate(templateId: string): string {
    // Map templates to appropriate target levels
    const levelMap: Record<string, string> = {
      student: "student",
      executive: "experienced",
      "executive-sidebar": "experienced",
    };
    return levelMap[templateId] || "fresher";
  }

  async function handleUseTemplate(templateId: string) {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selected?.name || "Untitled"} Resume`,
          template: templateId,
          targetLevel: targetLevelForTemplate(templateId),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${selected?.name || "Resume"} created! Opening builder...`);
        router.push(`/builder/${json.data.id}`);
      } else {
        toast.error("Failed to create resume. Please try again.");
        setCreating(false);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error("Failed to create resume:", err);
      setCreating(false);
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1120px] mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-h1 text-black mb-2">Choose Your Template</h1>
          <p className="text-body text-gray-500">
            Pick a starting template. AI populates your data into every layout — switch anytime without losing content.
          </p>
        </div>

        {/* Search + Sort toolbar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates by name…"
                aria-label="Search templates"
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-small outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
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
            <div className="relative w-full sm:w-64">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TemplateSortId)}
                aria-label="Sort templates"
                className="h-11 w-full pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-small text-black outline-none appearance-none cursor-pointer transition-all duration-200 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
              >
                {TEMPLATE_SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Filter chips — always visible */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 mr-1 text-micro font-semibold uppercase tracking-wider text-gray-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilters.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold">
                  {activeFilters.length}
                </span>
              )}
            </span>
            {TEMPLATE_FILTERS.map((f) => {
              const active = activeFilters.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-small font-medium border transition-all duration-150 active:scale-95",
                    active
                      ? "bg-accent-500 text-white border-accent-500 shadow-sm shadow-accent-500/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-accent-400 hover:text-accent-600"
                  )}
                >
                  {active && <Check className="w-3 h-3" strokeWidth={3} />}
                  {f.label}
                </button>
              );
            })}
            {(activeFilters.length > 0 || query.trim().length > 0) && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-small font-medium text-gray-500 hover:text-error transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
            <span className="ml-auto text-micro font-medium text-gray-400">
              Showing {visibleTemplates.length} of {templates.length} templates
            </span>
          </div>
        </div>

        {/* No results state */}
        {visibleTemplates.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center mb-12">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <SearchX className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-h3 text-black mb-1">No templates found</h3>
            <p className="text-body text-gray-500 mb-6">
              {query.trim() && activeFilters.length > 0
                ? `No templates match “${query.trim()}” with the selected filters.`
                : query.trim()
                  ? `No templates match “${query.trim()}”.`
                  : "No templates match the selected filters."}
            </p>
            <Button variant="secondary" size="sm" onClick={clearAll}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={cn(
                    "bg-white border-2 rounded-xl overflow-hidden text-left transition-all duration-200 hover:shadow-md group",
                    selectedId === template.id
                      ? "border-accent-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Preview window — real template rendering */}
                  <div className={cn(
                    "h-[180px] relative overflow-hidden bg-gradient-to-br",
                    template.gradient
                  )}>
                    <div className="absolute inset-4 bg-white rounded-sm shadow-md overflow-hidden">
                      <div
                        className="origin-top-left"
                        style={{
                          width: "210mm",
                          transform: `scale(${GRID_PREVIEW_SCALE})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <MemoTemplateRenderer
                          resume={{ ...SAMPLE_RESUME, template: template.key as ResumeTemplate }}
                        />
                      </div>
                    </div>
                    {template.popular && (
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold text-accent-600 px-2 py-0.5 rounded-full shadow-sm">
                        Popular
                      </span>
                    )}
                    {selectedId === template.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-h3 text-black">
                        <HighlightedName name={template.name} query={query} />
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[template.key]]?.bg || "bg-gray-100",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[template.key]]?.text || "text-gray-500"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            LAYOUT_BADGE[TEMPLATE_LAYOUT[template.key]]?.dot || "bg-gray-400"
                          )} />
                          {LAYOUT_BADGE[TEMPLATE_LAYOUT[template.key]]?.label || "—"}
                        </span>
                        <span className="text-micro font-medium text-gray-400 uppercase tracking-wider">{template.category}</span>
                      </div>
                    </div>
                    <p className="text-small text-gray-500 line-clamp-2">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected template detail + CTA */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-h2 text-black mb-2">{selected?.name}</h2>
                  <span className="inline-block text-micro font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                    {selected?.category}
                  </span>
                  <p className="text-body text-gray-600 mb-6 leading-relaxed">{selected?.description}</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={() => handleUseTemplate(selected?.key || "modern")}
                      disabled={creating}
                      className="inline-flex items-center gap-2"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Use {selected?.name} Template
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => handleUseTemplate(selected?.key || "modern")}
                      disabled={creating}
                      className="inline-flex items-center gap-2"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Start with Empty
                    </Button>
                  </div>
                </div>

                {/* Large real template preview */}
                <div className={cn(
                  "h-[360px] rounded-xl overflow-hidden bg-gradient-to-br relative flex items-center justify-center",
                  selected?.gradient
                )}>
                  <div className="absolute inset-5 bg-white rounded-lg shadow-xl overflow-hidden">
                    <div
                      className="origin-top-left"
                      style={{
                        width: "210mm",
                        transform: `scale(${DETAIL_PREVIEW_SCALE})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <MemoTemplateRenderer
                        resume={{ ...SAMPLE_RESUME, template: (selected?.key || "modern") as ResumeTemplate }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Comparison table */}
        {visibleTemplates.length >= 2 && (
          <div className="mt-16">
            <h2 className="text-h2 text-black mb-6">Compare Templates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 pr-6 text-small font-semibold text-black">Feature</th>
                    {visibleTemplates.map((t) => (
                      <th key={t.id} className={cn("py-3 px-4 text-small font-semibold text-center", selectedId === t.id ? "text-accent-600" : "text-gray-500")}>
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-small text-gray-600">
                  {(() => {
                    // Build comparison rows with all 8 templates
                    const comparisonRows = [
                      { label: "ATS-Optimized", modern: "✓", ats: "✓✓", student: "✓", minimal: "✓", executive: "✓", creative: "Partial", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Photo/Headshot", modern: "✓", ats: "—", student: "—", minimal: "—", executive: "—", creative: "✓", executiveSidebar: "—", modernCard: "—" },
                      { label: "Summary Section", modern: "✓", ats: "✓", student: "✓", minimal: "✓", executive: "✓", creative: "✓", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Experience Timeline", modern: "✓", ats: "✓", student: "—", minimal: "✓", executive: "✓", creative: "✓", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Skills Grid", modern: "✓", ats: "✓", student: "✓", minimal: "✓", executive: "✓", creative: "✓", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Projects Showcase", modern: "✓", ats: "—", student: "✓", minimal: "—", executive: "—", creative: "✓", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Certifications", modern: "✓", ats: "✓", student: "✓", minimal: "—", executive: "✓", creative: "—", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Languages", modern: "✓", ats: "—", student: "✓", minimal: "—", executive: "✓", creative: "✓", executiveSidebar: "✓", modernCard: "✓" },
                      { label: "Dark Sidebar Layout", modern: "—", ats: "—", student: "—", minimal: "—", executive: "—", creative: "—", executiveSidebar: "✓", modernCard: "—" },
                      { label: "Card-Style Sections", modern: "—", ats: "—", student: "—", minimal: "—", executive: "—", creative: "—", executiveSidebar: "—", modernCard: "✓" },
                    ];

                    const templateKeyMap: Record<string, string> = {
                      "ats-professional": "ats",
                      "executive-sidebar": "executiveSidebar",
                      "modern-card": "modernCard",
                    };

                    return comparisonRows.map((row) => (
                      <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 pr-6 font-medium text-gray-700">{row.label}</td>
                        {/* Dynamic columns — render each visible template column */}
                        {visibleTemplates.map((t) => {
                          const key = templateKeyMap[t.key] || t.key;
                          return (
                            <td key={t.id} className="py-2.5 px-4 text-center">
                              {(row as Record<string, string>)[key] || "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
