"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Crown,
  Eye,
  FileText,
  Gauge,
  Heart,
  Loader2,
  Lock,
  Maximize2,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  TEMPLATE_FILTERS,
  TEMPLATE_SORTS,
  filterTemplates,
  getCompareRows,
  getTemplateInfo,
  normalizeTemplateKey,
  sortTemplates,
  type TemplateFilterId,
  type TemplateSortId,
} from "@/features/resume-builder/config/template-discovery";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { TemplateDevicePreview } from "@/features/resume-builder/components/TemplateDevicePreview";
import { TemplatePreviewModal } from "@/features/resume-builder/components/TemplatePreviewModal";
import { useTemplateFavorites } from "@/features/resume-builder/hooks/useTemplateFavorites";
import {
  EXPERIENCE_OPTIONS,
  recommendTemplate,
  type ExperienceLevel,
  type TemplateRecommendation,
} from "@/features/resume-builder/config/template-recommendation";
import {
  TEMPLATE_PAGE_SIZE,
  hasMoreTemplates,
  nextVisibleCount,
} from "@/features/resume-builder/config/template-pagination";
import { useInView } from "@/features/resume-builder/hooks/useInView";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { UpgradeDialog } from "@/features/subscription/components/UpgradeDialog";

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

/** Heart toggle for saving/removing a template favorite (stops propagation). */
function FavoriteButton({
  active,
  onToggle,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 active:scale-90",
        active ? "bg-rose-50 text-rose-500" : "text-gray-300 hover:text-rose-400 hover:bg-rose-50",
        className
      )}
    >
      <Heart className={cn("w-4 h-4", active && "fill-rose-500")} />
    </button>
  );
}

/**
 * Epic 8.1 — Animated skeleton placeholder that mirrors a template card,
 * shown while the catalog is still loading.
 */
function TemplateCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      aria-hidden="true"
      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
      style={{ "--skeleton-delay": `${delay}s` } as CSSProperties}
    >
      {/* Preview band — a faux page inside a soft gradient */}
      <div className="h-[180px] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-4 rounded-sm bg-white shadow-sm overflow-hidden">
          <div className="p-3.5 space-y-2">
            <div className="h-2.5 w-2/3 rounded skeleton-shimmer" />
            <div className="h-2 w-full rounded skeleton-shimmer" />
            <div className="h-2 w-5/6 rounded skeleton-shimmer" />
            <div className="h-2 w-1/2 rounded skeleton-shimmer" />
            <div className="pt-2 mt-1 border-t border-gray-100 space-y-2">
              <div className="h-1.5 w-full rounded skeleton-shimmer" />
              <div className="h-1.5 w-4/5 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
      {/* Info area */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-28 rounded skeleton-shimmer" />
          <div className="h-5 w-14 rounded-full skeleton-shimmer" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full skeleton-shimmer" />
            ))}
            <div className="ml-1 h-2.5 w-6 rounded skeleton-shimmer" />
          </div>
          <div className="h-4 w-16 rounded-full skeleton-shimmer" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded skeleton-shimmer" />
          <div className="h-2.5 w-4/5 rounded skeleton-shimmer" />
        </div>
        <div className="flex gap-1.5 pt-0.5">
          <div className="h-4 w-20 rounded-full skeleton-shimmer" />
          <div className="h-4 w-14 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/**
 * Epic 10.1 — Renders the (expensive) template preview only once the card is
 * near the viewport; off-screen cards show a cheap placeholder instead, so the
 * initial paint and the DOM stay light even with many templates.
 */
function LazyTemplatePreview({ template, scale }: { template: Template; scale: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "600px 0px", once: true });

  return (
    <div
      ref={ref}
      className="w-full h-full bg-white rounded-sm shadow-md transition-transform duration-300 ease-out origin-center group-hover:scale-[1.07]"
    >
      {inView ? (
        <div
          className="origin-top-left"
          style={{ width: "210mm", transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <MemoTemplateRenderer resume={{ ...SAMPLE_RESUME, template: template.key as ResumeTemplate }} />
        </div>
      ) : (
        <div aria-hidden="true" className="p-3.5 space-y-2">
          <div className="h-2.5 w-2/3 rounded skeleton-shimmer" />
          <div className="h-2 w-full rounded skeleton-shimmer" />
          <div className="h-2 w-5/6 rounded skeleton-shimmer" />
          <div className="h-2 w-1/2 rounded skeleton-shimmer" />
        </div>
      )}
    </div>
  );
}

/** Small live thumbnail for a template, used in the compare table header. */
function TemplateThumb({ template }: { template: Template }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("w-10 h-14 rounded overflow-hidden bg-gradient-to-br shrink-0 relative", template.gradient)}>
        <span className="absolute inset-0.5 bg-white rounded-[2px] overflow-hidden">
          <span
            className="block origin-top-left"
            style={{ width: "210mm", transform: "scale(0.05)", transformOrigin: "top left" }}
          >
            <MemoTemplateRenderer resume={{ ...SAMPLE_RESUME, template: template.key as ResumeTemplate }} />
          </span>
        </span>
      </span>
      <span className="text-small font-semibold text-black">{template.name}</span>
    </span>
  );
}

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // Empty until the API settles — templatesLoading drives the skeleton placeholders (Epic 8.1)
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("modern");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<TemplateFilterId[]>([]);
  const [sortBy, setSortBy] = useState<TemplateSortId>("popular");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [compareA, setCompareA] = useState<string>("modern");
  const [compareB, setCompareB] = useState<string>("ats-professional");
  // Epic 10.2 — how many cards are currently revealed (infinite scroll)
  const [visibleCount, setVisibleCount] = useState(TEMPLATE_PAGE_SIZE);
  const { favorites, isFavorite, toggleFavorite } = useTemplateFavorites();
  const [recRole, setRecRole] = useState("");
  const [recExperience, setRecExperience] = useState<ExperienceLevel>("mid");
  const [recIndustry, setRecIndustry] = useState("");
  const [recommendation, setRecommendation] = useState<TemplateRecommendation | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { isPro, loading: subLoading } = useSubscription();

  // Fetch active templates from API; fall back to hardcoded FALLBACK_TEMPLATES on error
  useEffect(() => {
    const controller = new AbortController();

    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates", { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setTemplates(json.data.map(mapApiTemplate));
        } else {
          // API returned no rows — keep the hardcoded catalog usable
          setTemplates(FALLBACK_TEMPLATES);
        }
      } catch {
        // Aborted (unmount / StrictMode remount) or network failure
        if (controller.signal.aborted) return;
        // Network/parse failure — fall back to the hardcoded catalog
        setTemplates(FALLBACK_TEMPLATES);
      } finally {
        // Don't end loading for an aborted request — the remounted effect owns it
        if (!controller.signal.aborted) setTemplatesLoading(false);
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

  // Epic 10.2 — reveal cards a page at a time; the scroll sentinel loads more
  const loadedTemplates = visibleTemplates.slice(0, visibleCount);
  const moreAvailable = hasMoreTemplates(loadedTemplates.length, visibleTemplates.length);
  const { ref: sentinelRef, inView: sentinelInView } = useInView<HTMLDivElement>({ rootMargin: "400px 0px" });

  const loadMore = useCallback(() => {
    setVisibleCount((c) => nextVisibleCount(c, visibleTemplates.length));
  }, [visibleTemplates.length]);

  // Auto-load the next page whenever the sentinel scrolls into view
  useEffect(() => {
    if (sentinelInView && moreAvailable) loadMore();
  }, [sentinelInView, moreAvailable, loadMore]);

  // Reset pagination whenever the result set changes
  useEffect(() => {
    setVisibleCount(TEMPLATE_PAGE_SIZE);
  }, [templates, query, activeFilters, sortBy]);

  // Reset selected to first visible template when the current one is filtered out
  useEffect(() => {
    if (visibleTemplates.length > 0 && !visibleTemplates.find((t) => t.id === selectedId)) {
      setSelectedId(visibleTemplates[0].id);
    }
  }, [visibleTemplates, selectedId]);

  const selected = visibleTemplates.find((t) => t.id === selectedId) || visibleTemplates[0];
  const selectedInfo = getTemplateInfo(selected?.key || "modern", selected?.name || "Modern");

  // Templates the user has ❤️'d, for the "My Favorite Templates" strip
  const favoriteTemplates = useMemo(
    () => templates.filter((t) => favorites.includes(t.key)),
    [templates, favorites]
  );

  // A-vs-B compare state
  const compareTemplateA = templates.find((t) => t.key === compareA);
  const compareTemplateB = templates.find((t) => t.key === compareB);
  const compareRows =
    compareTemplateA && compareTemplateB
      ? getCompareRows(compareA, compareTemplateA.name, compareB, compareTemplateB.name)
      : [];

  const recommendedGradient = recommendation
    ? GRADIENT_MAP[recommendation.key] || "from-gray-500 to-gray-700"
    : "";

  function handleRecommend(e: FormEvent) {
    e.preventDefault();
    const rec = recommendTemplate({ role: recRole, experience: recExperience, industry: recIndustry });
    setRecommendation(rec);
    // Also select the recommended template so the detail panel reflects it
    const t = templates.find((x) => x.key === rec.key);
    if (t) setSelectedId(t.id);
  }

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

  async function handleUseTemplate(templateId: string, titleName?: string) {
    // Premium templates require Pro — surface the upgrade dialog instead.
    // Gate on !isPro alone (NOT subLoading): while the subscription fetch is
    // still in flight isPro defaults to false, so including subLoading here
    // would let a free user create a premium resume during that window.
    if (getTemplateInfo(templateId, titleName || "").tier === "premium" && !isPro) {
      const t = templates.find((x) => x.key === templateId);
      if (t) setSelectedId(t.id);
      setUpgradeOpen(true);
      return;
    }
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
          title: `${titleName || selected?.name || "Untitled"} Resume`,
          template: templateId,
          targetLevel: targetLevelForTemplate(templateId),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${titleName || selected?.name || "Resume"} created! Opening builder...`);
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

        {/* AI Template Recommendation (Epic 5) */}
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent-500" />
            <h2 className="text-h2 text-black">AI Template Recommendation</h2>
          </div>
          <p className="text-body text-gray-500 mb-5">
            Tell us about the role and we'll suggest the best template — with the reasoning.
          </p>

          <form onSubmit={handleRecommend} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3">
            <input
              type="text"
              value={recRole}
              onChange={(e) => setRecRole(e.target.value)}
              placeholder="Job role (e.g. Software Engineer)"
              aria-label="Job role"
              className="h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-small outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            />
            <select
              value={recExperience}
              onChange={(e) => setRecExperience(e.target.value as ExperienceLevel)}
              aria-label="Experience level"
              className="h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-small text-black outline-none appearance-none cursor-pointer transition-all duration-200 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            >
              {EXPERIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={recIndustry}
              onChange={(e) => setRecIndustry(e.target.value)}
              placeholder="Industry (e.g. Technology)"
              aria-label="Industry"
              className="h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-small outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            />
            <Button type="submit" variant="accent" className="h-11">
              <Sparkles className="w-4 h-4" /> Recommend
            </Button>
          </form>

          {recommendation && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="grid md:grid-cols-[240px_1fr] gap-6 items-start">
                {/* Recommended template preview */}
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className={cn("h-56 relative overflow-hidden bg-gradient-to-br", recommendedGradient)}>
                    <div className="absolute inset-3 overflow-hidden rounded-sm">
                      <div className="w-full h-full bg-white rounded-sm shadow-sm">
                        <div
                          className="origin-top-left"
                          style={{ width: "210mm", transform: "scale(0.24)", transformOrigin: "top left" }}
                        >
                          <MemoTemplateRenderer
                            resume={{ ...SAMPLE_RESUME, template: recommendation.key as ResumeTemplate }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold text-accent-600 px-2 py-0.5 rounded-full shadow-sm">
                      Best Match
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-h3 text-black">{recommendation.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-micro font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <Gauge size={11} /> ATS {recommendation.atsScore}%
                      </span>
                      <span className="inline-flex items-center gap-1 text-micro font-semibold text-accent-600 bg-accent-50 border border-accent-200 rounded-full px-2 py-0.5">
                        <TrendingUp size={11} /> {recommendation.recruiterAppeal}
                      </span>
                    </div>
                    <Button
                      variant="accent"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleUseTemplate(recommendation.key, recommendation.name)}
                    >
                      Use {recommendation.name}
                    </Button>
                  </div>
                </div>

                {/* Reasoning — Task 5.2 explanation bullets */}
                <div>
                  <p className="text-micro font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Recommended because
                  </p>
                  <p className="text-body text-gray-600 mb-4 leading-relaxed">{recommendation.reason}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {recommendation.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-small text-gray-700">
                        <Check size={14} strokeWidth={3} className="text-emerald-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
            <span aria-live="polite" className="ml-auto text-micro font-medium text-gray-400">
              {templatesLoading ? (
                <span className="inline-block align-middle w-28 h-3 rounded skeleton-shimmer" aria-hidden="true" />
              ) : (
                <>Showing {loadedTemplates.length} of {visibleTemplates.length} templates</>
              )}
            </span>
          </div>
        </div>

        {/* My Favorite Templates */}
        {favoriteTemplates.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <h2 className="text-h2 text-black">My Favorite Templates</h2>
              <span className="text-micro font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
                {favoriteTemplates.length}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
              {favoriteTemplates.map((template) => (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(template.id)}
                  onKeyDown={(e) => {
                    // Ignore key events bubbled from inner controls (e.g. heart button)
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(template.id);
                    }
                  }}
                  className="group w-44 shrink-0 snap-start bg-white border-2 rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-200 hover:shadow-md"
                >
                  <div className={cn("h-24 relative overflow-hidden bg-gradient-to-br", template.gradient)}>
                    <div className="absolute inset-2 overflow-hidden rounded-sm">
                      <div className="w-full h-full bg-white rounded-sm shadow-sm">
                        <div
                          className="origin-top-left"
                          style={{ width: "210mm", transform: "scale(0.2)", transformOrigin: "top left" }}
                        >
                          <MemoTemplateRenderer
                            resume={{ ...SAMPLE_RESUME, template: template.key as ResumeTemplate }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-white/80 backdrop-blur-sm p-0.5 shadow-sm">
                      <FavoriteButton active onToggle={() => toggleFavorite(template.key)} />
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-small font-semibold text-black truncate">{template.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Epic 8.1 — Skeleton loading: animated placeholders while templates fetch */}
        {templatesLoading ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Loading templates"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateCardSkeleton key={i} delay={i * -0.16} />
            ))}
          </div>
        ) : visibleTemplates.length === 0 ? (
          /* Epic 8.2 — Empty state: nothing matches the current search/filters */
          <div
            aria-live="polite"
            className="bg-white border-2 border-dashed border-gray-200 rounded-xl px-8 py-14 text-center mb-12"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center mb-5">
              <SearchX className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-h3 text-black mb-2">No templates found</h3>
            <p className="text-body text-gray-500 mb-6 max-w-md mx-auto">
              {query.trim() && activeFilters.length > 0
                ? `No templates match “${query.trim()}” with the selected filters.`
                : query.trim()
                  ? `No templates match “${query.trim()}”.`
                  : "No templates match the selected filters."}
            </p>

            {/* Active filters the user can remove one at a time */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {activeFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    aria-label={`Remove ${TEMPLATE_FILTERS.find((x) => x.id === f)?.label ?? f} filter`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-medium bg-gray-100 text-gray-600 border border-gray-200 transition-all duration-150 hover:border-rose-300 hover:text-error hover:bg-rose-50 active:scale-95"
                  >
                    {TEMPLATE_FILTERS.find((x) => x.id === f)?.label ?? f}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {loadedTemplates.map((template) => {
                const info = getTemplateInfo(template.key, template.name);
                return (
                <div
                  key={template.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(template.id)}
                  onKeyDown={(e) => {
                    // Ignore key events bubbled from inner controls (e.g. heart button)
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(template.id);
                    }
                  }}
                  className={cn(
                    "bg-white border-2 rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-200 hover:shadow-md group",
                    selectedId === template.id
                      ? "border-accent-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Preview window — real template rendering with hover zoom */}
                  <div className={cn(
                    "h-[180px] relative overflow-hidden bg-gradient-to-br",
                    template.gradient
                  )}>
                    <div className="absolute inset-4 overflow-hidden rounded-sm">
                      {/* Epic 10.1 — lazy preview: render the heavy template only near the viewport */}
                      <LazyTemplatePreview template={template} scale={GRID_PREVIEW_SCALE} />
                    </div>
                    {/* Click to enlarge — opens the full interactive preview modal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                      aria-label={`Enlarge ${template.name} preview`}
                      title="Enlarge preview"
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gray-900/70 text-white flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-accent-500 hover:scale-110 active:scale-95 focus-visible:opacity-100"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    {template.popular && (
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold text-accent-600 px-2 py-0.5 rounded-full shadow-sm">
                        Popular
                      </span>
                    )}
                    {recommendation && template.key === recommendation.key && (
                      <span className="absolute bottom-2 left-2 bg-accent-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm inline-flex items-center gap-0.5">
                        <Sparkles size={9} /> Recommended
                      </span>
                    )}
                    {info.tier === "premium" && (
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm inline-flex items-center gap-1">
                        <Lock size={9} /> Premium
                      </span>
                    )}
                    {info.tier === "premium" && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-gray-600 text-[9px] font-medium px-2 py-0.5 rounded-full shadow-sm inline-flex items-center gap-1">
                        <Eye size={9} /> Preview allowed
                      </span>
                    )}
                    {selectedId === template.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-2.5">
                    {/* Name + tier badge + favorite heart */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-h3 text-black leading-snug">
                        <HighlightedName name={template.name} query={query} />
                      </h3>
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        <FavoriteButton
                          active={isFavorite(template.key)}
                          onToggle={() => toggleFavorite(template.key)}
                        />
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                          info.tier === "premium"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {info.tier === "premium" ? <Crown size={10} /> : <Check size={10} />}
                          {info.tier === "premium" ? "Premium" : "Free"}
                        </span>
                      </span>
                    </div>

                    {/* Rating + ATS score */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-0.5" aria-label={`${info.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={12} className={cn(
                            i <= Math.round(info.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"
                          )} />
                        ))}
                        <span className="ml-1 text-micro font-semibold text-gray-600">{info.rating.toFixed(1)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-micro font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                        <Gauge size={11} /> ATS {info.atsScore}%
                      </span>
                    </div>

                    {/* Best For + Industry + Pages */}
                    <dl className="text-small text-gray-500 space-y-1">
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400 shrink-0">Best For</dt>
                        <dd className="font-medium text-gray-700 text-right">{info.bestFor}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400 shrink-0">Industry</dt>
                        <dd className="font-medium text-gray-700 text-right">{info.industry}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400 shrink-0">Pages</dt>
                        <dd className="font-medium text-gray-700 text-right inline-flex items-center gap-1">
                          <FileText size={11} className="text-gray-400" /> {info.pages}
                        </dd>
                      </div>
                    </dl>

                    {/* One-line description */}
                    <p className="text-small text-gray-500 line-clamp-1">{info.tagline}</p>

                    {/* Tags */}
                    {info.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {info.tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Usage stats */}
                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 mt-auto text-micro text-gray-400">
                      <span className="inline-flex items-center gap-1"><Users size={11} /> {info.usedBy.toLocaleString()} users</span>
                      <span className="inline-flex items-center gap-1"><TrendingUp size={11} /> {info.interviewSuccess}% interviews</span>
                    </div>

                    {/* Upgrade CTA for premium templates */}
                    {info.tier === "premium" && !isPro && !subLoading && (
                      <Button
                        variant="accent"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(template.id);
                          setUpgradeOpen(true);
                        }}
                      >
                        <Lock size={12} /> Upgrade to Use
                      </Button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Epic 10.2 — Infinite scroll: sentinel that auto-loads + "Load more" affordance */}
            <div
              ref={sentinelRef}
              className={cn(
                "flex flex-col items-center gap-3",
                moreAvailable || visibleTemplates.length > TEMPLATE_PAGE_SIZE ? "pb-12 pt-1" : ""
              )}
            >
              {moreAvailable ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadMore}
                  className="inline-flex items-center gap-1.5"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Load more templates
                  <span className="text-gray-400 font-normal">
                    ({visibleTemplates.length - loadedTemplates.length} remaining)
                  </span>
                </Button>
              ) : (
                visibleTemplates.length > TEMPLATE_PAGE_SIZE && (
                  <p className="text-micro font-medium text-gray-400">
                    You've seen all {visibleTemplates.length} templates
                  </p>
                )
              )}
            </div>

            {/* Selected template detail + CTA */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-h2 text-black">{selected?.name}</h2>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-micro font-bold uppercase tracking-wider border",
                      selectedInfo.tier === "premium"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {selectedInfo.tier === "premium" ? <Crown size={12} /> : <Check size={12} />}
                      {selectedInfo.tier === "premium" ? "Premium" : "Free"}
                    </span>
                    <FavoriteButton
                      active={selected ? isFavorite(selected.key) : false}
                      onToggle={() => selected && toggleFavorite(selected.key)}
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-1 text-amber-500" aria-label={`${selectedInfo.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={16} className={cn(
                          i <= Math.round(selectedInfo.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"
                        )} />
                      ))}
                      <span className="ml-1 text-small font-semibold text-gray-600">{selectedInfo.rating.toFixed(1)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-small font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      <Gauge size={13} /> ATS {selectedInfo.atsScore}%
                    </span>
                    <span className="text-micro font-medium text-accent-600 bg-accent-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selected?.category}
                    </span>
                  </div>

                  {/* Key facts grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-micro text-gray-400 uppercase tracking-wider mb-0.5">Best For</p>
                      <p className="text-small font-semibold text-gray-800">{selectedInfo.bestFor}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-micro text-gray-400 uppercase tracking-wider mb-0.5">Industry</p>
                      <p className="text-small font-semibold text-gray-800">{selectedInfo.industry}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-micro text-gray-400 uppercase tracking-wider mb-0.5">Pages Supported</p>
                      <p className="text-small font-semibold text-gray-800 inline-flex items-center gap-1">
                        <FileText size={12} className="text-gray-400" /> {selectedInfo.pages}
                      </p>
                    </div>
                  </div>

                  {/* Tags + usage stats */}
                  {selectedInfo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedInfo.tags.map((tag) => (
                        <span key={tag} className="text-micro font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6 text-small text-gray-500">
                    <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-gray-400" /> Used by {selectedInfo.usedBy.toLocaleString()} users</span>
                    <span className="inline-flex items-center gap-1.5"><TrendingUp size={14} className="text-gray-400" /> {selectedInfo.interviewSuccess}% interview success</span>
                  </div>

                  {/* Task 5.2 — explain the recommendation instead of a bare label */}
                  {recommendation && selected?.key === recommendation.key && (
                    <div className="rounded-xl border border-accent-200 bg-accent-50/50 p-4 mb-6">
                      <p className="text-micro font-bold uppercase tracking-wider text-accent-700 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Recommended because
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {recommendation.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-1.5 text-small text-gray-700">
                            <Check size={13} strokeWidth={3} className="text-emerald-500 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-body text-gray-600 mb-6 leading-relaxed">{selected?.description}</p>

                  {selectedInfo.tier === "premium" && !isPro && !subLoading && (
                    <p className="flex items-center gap-1.5 text-micro text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 mb-4">
                      <Lock size={12} /> Premium template — preview allowed; upgrade to use it in the builder.
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={() => handleUseTemplate(selected?.key || "modern")}
                      disabled={creating}
                      className="inline-flex items-center gap-2"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                      {selectedInfo.tier === "premium" && !isPro ? "Upgrade to Use" : `Use ${selected?.name} Template`}
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

                {/* Large interactive preview with device toggle + zoom */}
                <div className="h-[420px] flex flex-col">
                  <TemplateDevicePreview
                    resume={{ ...SAMPLE_RESUME, template: (selected?.key || "modern") as ResumeTemplate }}
                    onEnlarge={() => selected && setPreviewTemplate(selected)}
                  />
                </div>
              </div>
            </div>

            {/* Compare Templates — A vs B */}
            {compareRows.length > 0 && compareTemplateA && compareTemplateB && (
              <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-h2 text-black mb-1">Compare Templates</h2>
                    <p className="text-body text-gray-500">Pick two templates and see how they stack up side by side.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      aria-label="Choose template A"
                      className="h-10 max-w-[160px] rounded-lg border border-gray-200 bg-white text-small text-black px-3 outline-none cursor-pointer transition-all hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    >
                      {templates.map((t) => (
                        <option key={t.key} value={t.key} disabled={t.key === compareB}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setCompareA(compareB);
                        setCompareB(compareA);
                      }}
                      aria-label="Swap template A and B"
                      title="Swap templates"
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-accent-600 hover:bg-accent-50 transition-all active:scale-95"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      aria-label="Choose template B"
                      className="h-10 max-w-[160px] rounded-lg border border-gray-200 bg-white text-small text-black px-3 outline-none cursor-pointer transition-all hover:border-gray-300 focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    >
                      {templates.map((t) => (
                        <option key={t.key} value={t.key} disabled={t.key === compareA}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[560px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 pr-6 text-micro font-semibold uppercase tracking-wider text-gray-400">
                          Feature
                        </th>
                        <th className="py-3 pr-6 text-left font-semibold">
                          <TemplateThumb template={compareTemplateA} />
                        </th>
                        <th className="py-3 text-left font-semibold">
                          <TemplateThumb template={compareTemplateB} />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-small text-gray-600">
                      {compareRows.map((row) => (
                        <tr key={row.label} className="border-b border-gray-100 last:border-b-0 align-top">
                          <td className="py-3 pr-6 font-medium text-gray-700 whitespace-nowrap">{row.label}</td>
                          <td className="py-3 pr-6">
                            {row.label === "ATS Score" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <Gauge size={12} /> {row.a}
                              </span>
                            ) : (
                              row.a
                            )}
                          </td>
                          <td className="py-3">
                            {row.label === "ATS Score" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <Gauge size={12} /> {row.b}
                              </span>
                            ) : (
                              row.b
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full-screen interactive preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          name={previewTemplate.name}
          resume={{ ...SAMPLE_RESUME, template: previewTemplate.key as ResumeTemplate }}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Premium upgrade dialog (Epic 6) */}
      {upgradeOpen && (
        <UpgradeDialog
          templateName={selected?.name}
          onClose={() => setUpgradeOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
