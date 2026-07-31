"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Check,
  CheckCircle2,
  Circle,
  Play,
  GitBranch,
  Globe,
  Layout,
  FileText,
  User,
  Wrench,
  ArrowRight,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TEMPLATE_DISPLAY, TEMPLATE_BADGE } from "@/features/resume-builder/config/template-constants";
import { ProductTourModal } from "./ProductTourModal";

interface WelcomeEmptyStateProps {
  onCreate: () => void;
  onCreateWithTemplate: (templateId: string, targetLevel: string) => void;
}

const SUGGESTED_TEMPLATES: { id: string; targetLevel: string; tagline: string }[] = [
  { id: "modern", targetLevel: "fresher", tagline: "Balanced & clean" },
  { id: "ats-professional", targetLevel: "fresher", tagline: "Recruiter-friendly" },
  { id: "student", targetLevel: "student", tagline: "Academics first" },
  { id: "executive", targetLevel: "experienced", tagline: "Senior leadership" },
];

const CHECKLIST = [
  { id: "personalInfo", label: "Personal Info", icon: User },
  { id: "summary", label: "Professional Summary", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "projects", label: "Projects", icon: Layout },
];

/** Decorative welcome illustration built with pure CSS. */
function WelcomeIllustration() {
  return (
    <div className="relative w-[300px] h-[300px] mx-auto lg:mx-0 select-none pointer-events-none" aria-hidden="true">
      {/* Glow orb */}
      <div className="absolute inset-0 m-auto w-56 h-56 rounded-full bg-gradient-to-br from-accent-300/40 to-accent-600/20 blur-2xl" />

      {/* Resume document */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-2.5 rotate-[-3deg]">
        <div className="w-16 h-3 rounded-full bg-gradient-to-r from-accent-500 to-accent-600" />
        <div className="w-24 h-1.5 rounded-full bg-gray-200" />
        <div className="w-full h-1.5 rounded-full bg-gray-100" />
        <div className="w-5/6 h-1.5 rounded-full bg-gray-100" />
        <div className="mt-1.5 w-20 h-1.5 rounded-full bg-gray-200" />
        <div className="w-full h-1.5 rounded-full bg-gray-100" />
        <div className="w-2/3 h-1.5 rounded-full bg-gray-100" />
        <div className="mt-1.5 w-14 h-1.5 rounded-full bg-gray-200" />
        <div className="w-11/12 h-1.5 rounded-full bg-gray-100" />
        <div className="w-3/4 h-1.5 rounded-full bg-gray-100" />
      </div>

      {/* Floating progress badge */}
      <div className="absolute top-7 right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3.5 py-2.5 flex items-center gap-2.5 animate-[float_6s_ease-in-out_infinite]">
        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Progress</p>
          <p className="text-sm font-bold text-gray-900 leading-none mt-0.5">78% complete</p>
        </div>
      </div>

      {/* Floating ATS badge */}
      <div className="absolute bottom-8 left-0 bg-white rounded-xl shadow-lg border border-gray-100 px-3.5 py-2.5 flex items-center gap-2.5 animate-[float_7s_ease-in-out_infinite]">
        <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ATS Score</p>
          <p className="text-sm font-bold text-gray-900 leading-none mt-0.5">85 / 100</p>
        </div>
      </div>

      {/* Small sparkle dots */}
      <div className="absolute top-10 left-2 w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
      <div className="absolute bottom-16 right-2 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
    </div>
  );
}

export function WelcomeEmptyState({ onCreate, onCreateWithTemplate }: WelcomeEmptyStateProps) {
  const router = useRouter();
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-2 gap-8 items-center p-6 sm:p-8 md:p-12">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-[11px] font-bold uppercase tracking-wide mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to your resume studio
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              Build a resume that gets you hired
            </h2>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-md mb-7">
              Start from a template, import an existing resume, or build from scratch — our AI helps you
              write content that passes ATS filters and impresses recruiters.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                onClick={onCreate}
                className="gap-2 bg-black text-white hover:bg-gray-800 shadow-sm"
              >
                Create Resume
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setTourOpen(true)} className="gap-2">
                <Play className="w-4 h-4" />
                Take a quick tour
              </Button>
            </div>

            {/* Import options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide text-[10px] text-gray-400">Import from</span>
              <div className="flex items-center gap-2">
                <Link
                  href="/integrations/github"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                  GitHub
                </Link>
                <Link
                  href="/integrations/linkedin"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <WelcomeIllustration />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Template suggestions */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <Layout className="w-[18px] h-[18px]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Start with a template</h3>
                <p className="text-[11px] text-gray-400">Hand-picked to get you started fast</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {SUGGESTED_TEMPLATES.map((t) => {
              const badge = TEMPLATE_BADGE[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => onCreateWithTemplate(t.id, t.targetLevel)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/60 transition-all text-left group"
                >
                  <span className={cn("w-10 h-12 rounded-md shrink-0 flex items-center justify-center", badge?.bg || "bg-gray-100")}>
                    <span className={cn("w-3.5 h-3.5 rounded-full", badge?.dot || "bg-gray-400")} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-gray-800 group-hover:text-gray-900">
                      {TEMPLATE_DISPLAY[t.id] || t.id}
                    </span>
                    <span className="block text-[11px] text-gray-400 truncate">{t.tagline}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 gap-1.5 text-accent-600 hover:text-accent-700 hover:bg-accent-50"
            onClick={() => router.push("/templates")}
          >
            Browse all 8 templates
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Resume checklist */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Resume checklist</h3>
              <p className="text-[11px] text-gray-400">What a complete resume includes</p>
            </div>
          </div>
          <ul className="space-y-2">
            {CHECKLIST.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg text-[13px] text-gray-600">
                  <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {item.label}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
            Required sections are marked in the builder — optional ones (certifications, languages, leadership)
            can be added anytime.
          </p>
        </div>

        {/* How it works / mini tour */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent-500/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Wand2 className="w-[18px] h-[18px]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Your first 3 steps</h3>
                <p className="text-[11px] text-white/50">How it works</p>
              </div>
            </div>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-[13px] font-semibold">Add your details</p>
                  <p className="text-[11px] text-white/50 leading-relaxed">Fill guided sections — we'll organize it into a clean layout.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-[13px] font-semibold">Let AI polish it</p>
                  <p className="text-[11px] text-white/50 leading-relaxed">Improve bullet points, add metrics, and fix grammar.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-[13px] font-semibold">Export & get hired</p>
                  <p className="text-[11px] text-white/50 leading-relaxed">Download a PDF and check your ATS score in seconds.</p>
                </div>
              </li>
            </ol>
            <Button
              size="sm"
              onClick={() => setTourOpen(true)}
              className="mt-5 w-full gap-2 bg-white text-gray-900 hover:bg-gray-100"
            >
              <Play className="w-4 h-4" />
              Watch the full tour
            </Button>
          </div>
        </div>
      </div>

      <ProductTourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
