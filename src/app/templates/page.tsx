"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const TEMPLATES = [
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
];

function TemplateMiniPreview({ templateId, className }: { templateId: string; className?: string }) {
  const accentColor = templateId === "executive" ? "bg-indigo-900" :
    templateId === "creative" ? "bg-pink-500" :
    templateId === "ats-professional" ? "bg-gray-800" :
    templateId === "student" ? "bg-emerald-600" :
    templateId === "minimal" ? "bg-gray-400" : "bg-indigo-600";

  return (
    <div className={cn("w-full h-full rounded-sm overflow-hidden bg-white flex flex-col", className)}>
      {/* Mini template preview */}
      {templateId === "modern" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1.5 bg-black rounded mx-auto mb-0.5" /></div>
          <div className="w-6 h-0.5 bg-gray-300 rounded mx-auto" />
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="w-7 h-0.5 bg-gray-200 rounded mb-0.5" />
            <div className="w-5 h-0.5 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-0.5 bg-gray-100 rounded" />
          </div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="flex gap-1">
              <div className="flex-1 h-0.5 bg-gray-100 rounded" />
              <div className="flex-1 h-0.5 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}
      {templateId === "ats-professional" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-12 h-1 bg-gray-800 rounded mx-auto mb-0.5" /></div>
          <div className="w-7 h-0.5 bg-gray-300 rounded mx-auto" />
          <div className="mt-1">
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-6 h-0.5 bg-gray-100 rounded mb-0.5" />
            <div className="w-8 h-0.5 bg-gray-100 rounded mb-0.5" />
          </div>
          <div className="mt-1">
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
      {templateId === "student" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1 bg-emerald-600 rounded mx-auto mb-0.5" /></div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="flex gap-1">
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-100 rounded mb-0.5" /><div className="w-3/4 h-0.5 bg-gray-100 rounded" /></div>
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-100 rounded mb-0.5" /><div className="w-3/4 h-0.5 bg-gray-100 rounded" /></div>
            </div>
          </div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
      {templateId === "minimal" && (
        <div className="p-3 flex flex-col gap-2 text-[6px]">
          <div className="w-10 h-1 bg-gray-400 rounded" />
          <div className="w-full h-0.5 bg-gray-100 rounded" />
          <div className="w-full h-0.5 bg-gray-100 rounded" />
          <div className="w-8 h-0.5 bg-gray-100 rounded" />
        </div>
      )}
      {templateId === "executive" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1.5 bg-indigo-900 rounded mx-auto mb-0.5" /></div>
          <div className="w-6 h-0.5 bg-gray-500 rounded mx-auto" />
          <div className="mt-1 border-t border-indigo-200 pt-1">
            <div className="w-full h-0.5 bg-indigo-100 rounded mb-1" />
            <div className="flex gap-2">
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-200 rounded mb-0.5" /><div className="w-4 h-0.5 bg-gray-100 rounded" /></div>
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-200 rounded mb-0.5" /><div className="w-4 h-0.5 bg-gray-100 rounded" /></div>
            </div>
          </div>
        </div>
      )}
      {templateId === "creative" && (
        <div className="flex h-full">
          <div className="w-1/3 bg-pink-100 p-1.5 flex flex-col gap-1">
            <div className="w-full h-1 bg-pink-400 rounded" />
            <div className="w-full h-0.5 bg-pink-300 rounded" />
            <div className="w-full h-0.5 bg-pink-300 rounded" />
          </div>
          <div className="w-2/3 p-1.5 flex flex-col gap-1">
            <div className="w-full h-0.5 bg-black rounded" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
            <div className="w-full h-0.5 bg-gray-100 rounded" />
            <div className="w-4 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedId, setSelectedId] = useState<string>("modern");

  const selected = TEMPLATES.find((t) => t.id === selectedId) || TEMPLATES[0];

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
          {TEMPLATES.map((template) => (
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
              {/* Preview window */}
              <div className={cn(
                "h-[180px] relative overflow-hidden bg-gradient-to-br",
                template.gradient
              )}>
                <div className="absolute inset-4 bg-white rounded-sm shadow-md">
                  <TemplateMiniPreview templateId={template.id} className="h-full" />
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
                  <span className="text-micro font-medium text-gray-400 uppercase tracking-wider">{template.category}</span>
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
              <h2 className="text-h2 text-black mb-2">{selected.name}</h2>
              <span className="inline-block text-micro font-bold text-accent-600 bg-accent-50 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                {selected.category}
              </span>
              <p className="text-body text-gray-600 mb-6 leading-relaxed">{selected.description}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={user ? `/builder/new?template=${selected.id}` : "/sign-up"}>
                  <Button variant="accent" size="lg">
                    Use {selected.name} Template
                  </Button>
                </Link>
                <Link href={user ? `/builder/new?template=${selected.id}` : "/sign-up"}>
                  <Button variant="secondary" size="lg">
                    Start with Empty
                  </Button>
                </Link>
              </div>
            </div>

            <div className={cn(
              "h-[320px] rounded-xl overflow-hidden bg-gradient-to-br relative flex items-center justify-center",
              selected.gradient
            )}>
              <div className="absolute inset-6 bg-white rounded-lg shadow-xl">
                <TemplateMiniPreview templateId={selected.id} className="h-full scale-150 origin-top-left" />
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
                  {TEMPLATES.map((t) => (
                    <th key={t.id} className={cn("py-3 px-4 text-small font-semibold text-center", selectedId === t.id ? "text-accent-600" : "text-gray-500")}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-small text-gray-600">
                {[
                  { label: "ATS-Optimized", modern: "✓", ats: "✓✓", student: "✓", minimal: "✓", executive: "✓", creative: "Partial" },
                  { label: "Photo/Headshot", modern: "✓", ats: "—", student: "—", minimal: "—", executive: "—", creative: "✓" },
                  { label: "Summary Section", modern: "✓", ats: "✓", student: "✓", minimal: "✓", executive: "✓", creative: "✓" },
                  { label: "Experience Timeline", modern: "✓", ats: "✓", student: "—", minimal: "✓", executive: "✓", creative: "✓" },
                  { label: "Skills Grid", modern: "✓", ats: "✓", student: "✓", minimal: "✓", executive: "✓", creative: "✓" },
                  { label: "Projects Showcase", modern: "✓", ats: "—", student: "✓", minimal: "—", executive: "—", creative: "✓" },
                  { label: "Certifications", modern: "✓", ats: "✓", student: "✓", minimal: "—", executive: "✓", creative: "—" },
                  { label: "Languages", modern: "✓", ats: "—", student: "✓", minimal: "—", executive: "✓", creative: "✓" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 pr-6 font-medium text-gray-700">{row.label}</td>
                    <td className="py-2.5 px-4 text-center">{row.modern}</td>
                    <td className="py-2.5 px-4 text-center">{row.ats}</td>
                    <td className="py-2.5 px-4 text-center">{row.student}</td>
                    <td className="py-2.5 px-4 text-center">{row.minimal}</td>
                    <td className="py-2.5 px-4 text-center">{row.executive}</td>
                    <td className="py-2.5 px-4 text-center">{row.creative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
