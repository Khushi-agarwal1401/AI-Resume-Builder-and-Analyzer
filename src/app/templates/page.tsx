"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATE_LAYOUT, LAYOUT_BADGE } from "@/features/resume-builder/config/template-constants";
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
  name: string;
  description: string;
  category: string;
  popular: boolean;
  gradient: string;
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and balanced layout suitable for most industries. Features a centered header with full contact info, professional summary, experience timeline, and dedicated sections for education, skills, projects, certifications, achievements, and languages.",
    category: "General",
    popular: true,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "ats-professional",
    name: "ATS Professional",
    description: "Optimized for Applicant Tracking Systems with a clean single-column structure. Uses section headers with gray backgrounds and a standardized format that parsers handle reliably.",
    category: "ATS-Optimized",
    popular: true,
    gradient: "from-gray-700 to-gray-900",
  },
  {
    id: "student",
    name: "Student",
    description: "Designed for students and recent graduates with emphasis on education, projects, and certifications. Highlights academic achievements and technical skills prominently.",
    category: "Entry-Level",
    popular: false,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "A minimalist design with generous whitespace and a clean sans-serif aesthetic. Uses subtle section labels and a light typography hierarchy for a modern, uncluttered look.",
    category: "Design",
    popular: false,
    gradient: "from-gray-400 to-gray-500",
  },
  {
    id: "executive",
    name: "Executive",
    description: "A serif-based template with an elegant navy accent. Features an executive summary section, professional experience timeline, and a two-column skills layout. Ideal for senior roles.",
    category: "Executive",
    popular: true,
    gradient: "from-indigo-900 to-indigo-700",
  },
  {
    id: "creative",
    name: "Creative",
    description: "A bold, visually-driven layout with a pink sidebar containing skills and contact info. Features timeline-style experience entries with dot indicators and a project card grid. Best for creative roles.",
    category: "Creative",
    popular: false,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "executive-sidebar",
    name: "Exec Sidebar",
    description: "Two-column layout with a dark sidebar featuring contact, skills, and certifications. Main content area highlights profile summary, experience timeline, education, projects, and achievements. Ideal for senior leadership.",
    category: "Executive",
    popular: true,
    gradient: "from-slate-800 to-slate-900",
  },
  {
    id: "modern-card",
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
}): Template {
  return {
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description || "",
    category: apiTemplate.category,
    popular: POPULAR_IDS.has(apiTemplate.component_key),
    gradient: GRADIENT_MAP[apiTemplate.component_key] || "from-gray-500 to-gray-700",
  };
}

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>("modern");
  const [creating, setCreating] = useState(false);

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

  // Reset selected to first template when list changes
  useEffect(() => {
    if (templates.length > 0 && !templates.find((t) => t.id === selectedId)) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId]);

  const selected = templates.find((t) => t.id === selectedId) || templates[0];

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

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {templates.map((template) => (
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
                      resume={{ ...SAMPLE_RESUME, template: template.id as ResumeTemplate }}
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
                  onClick={() => handleUseTemplate(selected?.id || "modern")}
                  disabled={creating}
                  className="inline-flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Use {selected?.name} Template
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleUseTemplate(selected?.id || "modern")}
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
                    resume={{ ...SAMPLE_RESUME, template: (selected?.id || "modern") as ResumeTemplate }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-16">
          <h2 className="text-h2 text-black mb-6">Compare Templates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-6 text-small font-semibold text-black">Feature</th>
                  {templates.map((t) => (
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
                      {/* Dynamic columns — render each template column */}
                      {templates.map((t) => {
                        const key = templateKeyMap[t.id] || t.id;
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
      </div>
    </DashboardLayout>
  );
}
