"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check, Loader2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_LAYOUT, LAYOUT_BADGE } from "@/features/resume-builder/config/template-constants";
import type { ResumeData, ResumeTemplate, TargetLevel } from "@/types/resume";
import { TemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import { TemplateSetupDialog } from "@/features/resume-builder/components/TemplateSetupDialog";
import { IMPORTED_TEMPLATES, BUILTIN_TEMPLATE_IDS } from "@/features/resume-builder/templates/imported/catalog";

// ─── Sample Resume Data (shared for all template previews) ──────────────
const SAMPLE_RESUME: ResumeData = {
  id: "preview", userId: "preview", title: "Sample Resume", template: "modern", targetLevel: "experienced", sectionOrder: [],
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
  name: string;
  description: string;
  category: string;
  popular: boolean;
  /** CSS gradient (inline) for the card preview shell. */
  gradient: string;
  /** Level filter: student | internship | experienced */
  level: "student" | "internship" | "experienced";
  /** Discovery filter tags. */
  tags: string[];
  source: string;
}

/** Hex → subtle two-stop CSS gradient for card shells. */
function gradientFromHex(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const lighten = (amt: number) => {
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };
  return `linear-gradient(135deg, ${lighten(28)} 0%, ${hex} 100%)`;
}

/** Built-in display metadata (kept stable, mirrors the original hardcoded list). */
const BUILTIN_META: Record<string, { name: string; description: string; category: string; gradient: string; level: Template["level"] }> = {
  modern: {
    name: "Modern",
    description: "Clean and balanced layout suitable for most industries. Features a centered header with full contact info, professional summary, experience timeline, and dedicated sections for education, skills, projects, certifications, achievements, and languages.",
    category: "General",
    gradient: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
    level: "experienced",
  },
  "ats-professional": {
    name: "ATS Professional",
    description: "Optimized for Applicant Tracking Systems with a clean single-column structure. Uses section headers with gray backgrounds and a standardized format that parsers handle reliably.",
    category: "ATS-Optimized",
    gradient: "linear-gradient(135deg, #4b5563 0%, #111827 100%)",
    level: "experienced",
  },
  student: {
    name: "Student",
    description: "Designed for students and recent graduates with emphasis on education, projects, and certifications. Highlights academic achievements and technical skills prominently.",
    category: "Entry-Level",
    gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
    level: "student",
  },
  minimal: {
    name: "Minimal",
    description: "A minimalist design with generous whitespace and a clean sans-serif aesthetic. Uses subtle section labels and a light typography hierarchy for a modern, uncluttered look.",
    category: "Design",
    gradient: "linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)",
    level: "experienced",
  },
  executive: {
    name: "Executive",
    description: "A serif-based template with an elegant navy accent. Features an executive summary section, professional experience timeline, and a two-column skills layout. Ideal for senior roles.",
    category: "Executive",
    gradient: "linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)",
    level: "experienced",
  },
  creative: {
    name: "Creative",
    description: "A bold, visually-driven layout with a pink sidebar containing skills and contact info. Features timeline-style experience entries with dot indicators and a project card grid. Best for creative roles.",
    category: "Creative",
    gradient: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
    level: "experienced",
  },
  "executive-sidebar": {
    name: "Exec Sidebar",
    description: "Two-column layout with a dark sidebar featuring contact, skills, and certifications. Main content area highlights profile summary, experience timeline, education, projects, and achievements. Ideal for senior leadership.",
    category: "Executive",
    gradient: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
    level: "experienced",
  },
  "modern-card": {
    name: "Card Modern",
    description: "Rounded card-style sections with indigo accent chips for skills and technologies. Clean border-based layout with subtle shadows, perfect for showcasing projects and certifications in a modern format.",
    category: "General",
    gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
    level: "experienced",
  },
};

/** Infer a level filter from imported config tags. */
function levelForTags(tags: string[]): Template["level"] {
  if (tags.includes("student")) return "student";
  if (tags.includes("executive")) return "experienced";
  // Classic/serif layouts (Garramond, Cambridge, Jake's Resume…) are the
  // timeless fresher/engineer staples; premium + technical lean internship.
  if (tags.includes("technical") || tags.includes("premium")) return "internship";
  if (tags.includes("classic")) return "internship";
  return "internship";
}

/** Map imported tags to the discovery filter vocabulary. */
function discoveryTags(tags: string[]): string[] {
  const out: string[] = [];
  const map: Record<string, string> = {
    "ats-safe": "ats-friendly",
    classic: "professional",
    elegant: "executive",
    technical: "professional",
    compact: "professional",
    timeline: "modern",
    photo: "modern",
    student: "student",
    modern: "modern",
    minimal: "minimal",
    creative: "creative",
    executive: "executive",
    premium: "premium",
    professional: "professional",
  };
  for (const t of tags) if (map[t]) out.push(map[t]);
  if (!out.includes("free")) out.push("free");
  return out;
}

/** All 96 templates: 8 built-ins + 88 imported catalog entries. */
const ALL_TEMPLATES: Template[] = [
  ...BUILTIN_TEMPLATE_IDS.map((id) => {
    const meta = BUILTIN_META[id];
    return {
      id,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      popular: id === "modern" || id === "ats-professional" || id === "executive" || id === "executive-sidebar",
      gradient: meta.gradient,
      level: meta.level,
      tags: discoveryTags([meta.level === "student" ? "student" : "professional", "ats-friendly"]),
      source: "built-in",
    };
  }),
  ...IMPORTED_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.tags.includes("classic") ? "Classic" : t.tags.includes("creative") ? "Creative" : t.tags.includes("minimal") ? "Minimal" : t.tags.includes("executive") ? "Executive" : t.layout.columns === 2 ? "Two-Column" : "Modern",
    popular: false,
    gradient: gradientFromHex(t.theme.primary),
    level: levelForTags(t.tags),
    tags: discoveryTags(t.tags),
    source: t.source,
  })),
];

const LEVEL_FILTERS: { id: "all" | Template["level"]; label: string }[] = [
  { id: "all", label: "All" },
  { id: "student", label: "Student" },
  { id: "internship", label: "Internship" },
  { id: "experienced", label: "Experienced" },
];

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "ats-friendly", label: "ATS Friendly" },
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "creative", label: "Creative" },
  { id: "executive", label: "Executive" },
  { id: "student", label: "Student" },
  { id: "premium", label: "Premium" },
];

// Scale factor for template previews in the grid cards
const GRID_PREVIEW_SCALE = 0.38;
// Scale factor for the large detail preview
const DETAIL_PREVIEW_SCALE = 0.55;

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(ALL_TEMPLATES);
  const [levelFilter, setLevelFilter] = useState<"all" | Template["level"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string>("modern");
  const [creating, setCreating] = useState(false);
  const [setupTemplate, setSetupTemplate] = useState<Template | null>(null);

  // Fetch active templates from API; merge into the catalog (catalog is the
  // source of truth for all 96, API rows only mark popularity/ordering).
  useEffect(() => {
    const controller = new AbortController();
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates", { signal: controller.signal });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiPopular = new Set(
            json.data.filter((t: { is_active?: boolean }) => t.is_active !== false).map((t: { component_key: string }) => t.component_key)
          );
          // Key both by camelCase component_key and its kebab form.
          const apiIds = new Set(
            json.data.map((t: { component_key: string }) => t.component_key).flatMap((k: string) => [k, k.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()])
          );
          setTemplates((prev) =>
            prev.map((t) =>
              apiIds.has(t.id) || apiIds.has(t.name)
                ? { ...t, popular: t.popular || apiPopular.has(t.name) }
                : t
            )
          );
        }
      } catch {
        // Fallback to ALL_TEMPLATES — already set as initial state
      }
    }
    fetchTemplates();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (levelFilter !== "all" && t.level !== levelFilter) return false;
      if (categoryFilter !== "all" && !t.tags.includes(categoryFilter)) return false;
      return true;
    });
  }, [templates, levelFilter, categoryFilter]);

  // Reset selected to first visible template when the list changes
  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((t) => t.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0];

  function targetLevelForTemplate(templateId: string): TargetLevel {
    const t = templates.find((x) => x.id === templateId);
    if (t?.level === "student") return "student";
    if (t?.level === "experienced") return "experienced";
    return "student_internship";
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

  // Open the post-template-selection setup dialog (manual vs. auto-import).
  function openTemplateSetup() {
    if (!user) {
      router.push("/sign-up");
      return;
    }
    setSetupTemplate(selected || null);
  }

  function handleCreated(resumeId: string) {
    setSetupTemplate(null);
    setCreating(false);
    toast.success("Resume created! Opening builder...");
    router.push(`/builder/${resumeId}`);
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
          <div className="flex items-center gap-2 mb-2">
            <LayoutTemplate className="w-5 h-5 text-accent-500" />
            <h1 className="text-h1 text-black">Choose Your Template</h1>
          </div>
          <p className="text-body text-gray-500">
            <span className="font-semibold text-gray-700">{ALL_TEMPLATES.length} templates</span> from 5 open-source projects —
            pick a starting layout. AI populates your data into every design — switch anytime without losing content.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Level</span>
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setLevelFilter(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border",
                  levelFilter === f.id
                    ? "bg-accent-500 text-white border-accent-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Category</span>
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                  categoryFilter === f.id
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl mb-12">
            <p className="text-gray-500 mb-1">No templates match these filters.</p>
            <button
              onClick={() => { setLevelFilter("all"); setCategoryFilter("all"); }}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((template) => (
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
                <div
                  className="h-[180px] relative overflow-hidden"
                  style={{ background: template.gradient }}
                >
                  <div className="absolute inset-4 bg-white rounded-sm shadow-md overflow-hidden">
                    <div
                      className="origin-top-left"
                      style={{
                        width: "210mm",
                        transform: `scale(${GRID_PREVIEW_SCALE})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <TemplateRenderer
                        resume={{ ...SAMPLE_RESUME, template: template.id as ResumeTemplate }}
                      />
                    </div>
                  </div>
                  {template.popular && (
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[9px] font-bold text-accent-600 px-2 py-0.5 rounded-full shadow-sm">
                      Popular
                    </span>
                  )}
                  {template.source !== "built-in" && (
                    <span className="absolute bottom-2 right-2 bg-black/40 backdrop-blur text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                      {template.source}
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
                    <h3 className="text-h3 text-black">{template.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0",
                        LAYOUT_BADGE[TEMPLATE_LAYOUT[template.id]]?.bg || "bg-gray-100",
                        LAYOUT_BADGE[TEMPLATE_LAYOUT[template.id]]?.text || "text-gray-500"
                      )}>
                        <span className={cn(
                          "w-1 h-1 rounded-full",
                          LAYOUT_BADGE[TEMPLATE_LAYOUT[template.id]]?.dot || "bg-gray-400"
                        )} />
                        {LAYOUT_BADGE[TEMPLATE_LAYOUT[template.id]]?.label || "—"}
                      </span>
                      <span className="text-micro font-medium text-gray-400 uppercase tracking-wider">{template.category}</span>
                    </div>
                  </div>
                  <p className="text-small text-gray-500 line-clamp-2">{template.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected template detail + CTA */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-h2 text-black mb-2">{selected.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block text-micro font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {selected.category}
                  </span>
                  {selected.source !== "built-in" && (
                    <span className="inline-block text-micro font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {selected.source}
                    </span>
                  )}
                </div>
                <p className="text-body text-gray-600 mb-6 leading-relaxed">{selected.description}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={openTemplateSetup}
                    disabled={creating}
                    className="inline-flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Use {selected.name} Template
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => handleUseTemplate(selected.id)}
                    disabled={creating}
                    className="inline-flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Start with Empty
                  </Button>
                </div>
              </div>

              {/* Large real template preview */}
              <div
                className="h-[360px] rounded-xl overflow-hidden relative flex items-center justify-center"
                style={{ background: selected.gradient }}
              >
                <div className="absolute inset-5 bg-white rounded-lg shadow-xl overflow-hidden">
                  <div
                    className="origin-top-left"
                    style={{
                      width: "210mm",
                      transform: `scale(${DETAIL_PREVIEW_SCALE})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <TemplateRenderer
                      resume={{ ...SAMPLE_RESUME, template: selected.id as ResumeTemplate }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-template-selection setup dialog (manual vs auto-import) */}
        {setupTemplate && (
          <TemplateSetupDialog
            open={!!setupTemplate}
            onClose={() => {
              setSetupTemplate(null);
              setCreating(false);
            }}
            template={{ id: setupTemplate.id, name: setupTemplate.name }}
            targetLevel={targetLevelForTemplate(setupTemplate.id)}
            onCreated={handleCreated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
