"use client";

import { useRef, useEffect, useCallback, useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";
import type { ResumeData } from "@/types/resume";
import { Modern } from "@/features/resume-builder/templates/Modern";
import { AtsProfessional } from "@/features/resume-builder/templates/AtsProfessional";
import { Creative } from "@/features/resume-builder/templates/Creative";
import { Executive } from "@/features/resume-builder/templates/Executive";
import {
  ArrowRight, CheckCircle2, Sparkles, RefreshCw, FileText,
  Briefcase, GraduationCap, Award, Check, TrendingUp,
  ShieldCheck, Target, BarChart3,
  Palette, ChevronRight, BookOpen, Video, HelpCircle,
  Mail, BrainCircuit, ScrollText,
  Search, LineChart, Rocket, Eye, MoveRight, Cloud,
  Zap, Smartphone, XCircle, CheckCircle,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─── Lazy-loaded 3D scenes ───────────────────────────────────────────────
const HeroScene = lazy(() => import("@/components/3d/HeroScene").then(m => ({ default: m.HeroScene })));
const FloatingOrbs = lazy(() => import("@/components/3d/FloatingOrbs").then(m => ({ default: m.FloatingOrbs })));

// ─── Sample Resume Data ──────────────────────────────────────────────────
const SAMPLE_RESUME: ResumeData = {
  id: "preview", userId: "preview", title: "Sample Resume", template: "modern", targetLevel: "experienced",
  personalInfo: { fullName: "Radheshyam Bhati", email: "radheshyam@email.com", phone: "+91 98765 43210", linkedin: "linkedin.com/in/radheshyam", github: "github.com/radheshyam", portfolio: "radheshyam.dev", photo: "" },
  summary: "Results-driven Software Engineer with 5+ years building scalable web applications and AI-powered solutions. Passionate about clean architecture and performance optimization.",
  education: [{ id: "edu1", institution: "Stanford University", degree: "B.Tech", field: "Computer Science", startDate: "2021", endDate: "2025", cgpa: "3.8" }],
  experience: [{ id: "exp1", company: "TechNova Solutions", role: "Senior Software Engineer", location: "San Francisco, CA", startDate: "2023", endDate: "2026", current: true, responsibilities: ["Architected microservices handling 100K+ daily active users", "Improved system performance by 40% through query optimization", "Led cross-functional team of 6 engineers delivering 3 major releases"], achievements: [] }],
  projects: [{ id: "proj1", name: "AI Resume Analyzer", description: "ML-powered resume analysis tool with 94% accuracy.", technologies: ["Python", "TensorFlow", "React", "PostgreSQL"], liveUrl: "", githubUrl: "" }],
  skills: { technical: ["Python", "TypeScript", "Go", "SQL"], soft: ["Leadership", "Communication"], tools: ["Docker", "Kubernetes", "AWS"], frameworks: ["React", "Next.js", "FastAPI"] },
  certifications: [{ id: "cert1", name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2024", url: "" }],
  achievements: [{ id: "ach1", title: "Best Engineering Award", description: "Outstanding contribution to platform reliability", date: "2025" }],
  languages: [{ id: "lang1", name: "English", proficiency: "native" }, { id: "lang2", name: "Hindi", proficiency: "native" }],
  codingProfiles: [], leadership: [], openSource: [], publications: [], volunteer: [], activities: [], coursework: [],
  interests: ["Machine Learning", "System Design", "Open Source"],
  createdAt: "2024-01-01", updatedAt: "2026-07-01",
};

// ─── Data Collections ───────────────────────────────────────────────────


const CAREER_STAGES = [
  { id: "student", icon: GraduationCap, title: "Student", desc: "Emphasize coursework, academic projects, leadership, and internships.", img: "/images/student.png", label: "Academic Focus", color: "emerald", gradient: "from-emerald-500 to-teal-500", metrics: "Focus: Projects & GPA" },
  { id: "internship", icon: Briefcase, title: "Internship", desc: "Highlight technical skills, hands-on projects, and entry-level impact.", img: "/images/internship.png", label: "Skill Showcase", color: "sky", gradient: "from-sky-500 to-blue-600", metrics: "Focus: Tech Stack & Tools" },
  { id: "fresher", icon: Sparkles, title: "Fresher", desc: "Stand out in competitive campus drives with high ATS keywords.", img: "/images/fresher.png", label: "Entry-Level Pro", color: "purple", gradient: "from-purple-500 to-indigo-600", metrics: "Focus: Problem Solving" },
  { id: "experienced", icon: TrendingUp, title: "Experienced", desc: "Demonstrate leadership, quantified business impact, and architecture scale.", img: "/images/experienced.png", label: "Senior Leadership", color: "rose", gradient: "from-rose-500 to-pink-600", metrics: "Focus: ROI & Team Metrics" },
];

const TEMPLATES = [
  { id: "modern" as const, name: "Modern", icon: FileText, component: Modern, desc: "Clean, crisp spacing with accent highlights" },
  { id: "ats-professional" as const, name: "ATS Pro", icon: ScrollText, component: AtsProfessional, desc: "Maximum ATS scanner parsing compatibility" },
  { id: "creative" as const, name: "Creative", icon: Palette, component: Creative, desc: "Distinct visual layout for tech & design roles" },
  { id: "executive" as const, name: "Executive", icon: Award, component: Executive, desc: "Structured layout for senior leadership & management" },
];

const ATS_ROLES_SIMULATOR = [
  {
    role: "Senior Full-Stack Engineer",
    score: 96,
    keywordsMatched: ["React", "TypeScript", "Node.js", "GraphQL", "AWS", "Microservices", "CI/CD"],
    keywordsMissing: ["Docker Swarm", "Kubernetes"],
    breakdown: { keywords: 95, format: 98, actionVerbs: 94, impactMetrics: 97 }
  },
  {
    role: "AI / ML Engineer",
    score: 93,
    keywordsMatched: ["Python", "TensorFlow", "PyTorch", "LLMs", "Vector DBs", "RAG", "FastAPI"],
    keywordsMissing: ["MLOps", "CUDA Optimization"],
    breakdown: { keywords: 92, format: 96, actionVerbs: 91, impactMetrics: 94 }
  },
  {
    role: "Product Manager",
    score: 89,
    keywordsMatched: ["Roadmap", "Agile", "User Research", "SQL", "A/B Testing", "KPIs"],
    keywordsMissing: ["Mixpanel", "Jira Admin"],
    breakdown: { keywords: 88, format: 94, actionVerbs: 86, impactMetrics: 89 }
  },
];

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "Essential tools for crafting your first resume.",
    popular: false,
    features: ["1 Master Resume", "Basic ATS Score Check", "3 Standard Templates", "PDF Export with Watermark", "Standard Support"],
    cta: "Get Started Free",
    href: "/sign-up"
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    annualPrice: 9,
    desc: "For active job seekers who want interviews guaranteed.",
    popular: true,
    features: ["Unlimited Resumes & Cover Letters", "Advanced AI ATS Match Simulator", "All 6 Premium Templates", "PDF + DOCX High-Res Export", "AI Action Verb & Metric Rewriter", "LinkedIn & GitHub Auto Sync"],
    cta: "Start Pro Trial",
    href: "/sign-up?plan=pro"
  },
  {
    name: "Executive",
    monthlyPrice: 29,
    annualPrice: 22,
    desc: "For career accelerators and senior leadership.",
    popular: false,
    features: ["Everything in Pro", "1-on-1 AI Interview Prep Assistant", "Unlimited AI Rewrite Credits", "Custom Color & Typography Themes", "Priority Recruiter Scan Audit", "24/7 Dedicated Support"],
    cta: "Go Executive",
    href: "/sign-up?plan=executive"
  },
];

// ─── Component: Mouse Tilt Spotlight Card ─────────────────────────────────
function HoverCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ perspective: 1000, rotateX, rotateY }}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Component: GSAP Counter ──────────────────────────────────────────────
function StatCounter({ value, label, suffix = "", prefix = "" }: { value: number; label: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { innerText: "0" }, {
        innerText: value, duration: 2.2, ease: "power3.out",
        snap: { innerText: 1 },
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate: () => { if (el) el.innerText = prefix + Math.round(parseInt(el.innerText, 10)).toLocaleString() + suffix; },
      });
    }, el);
    return () => ctx.revert();
  }, [value, suffix, prefix]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <span ref={ref} className="text-4xl lg:text-5xl font-black text-gray-900 tabular-nums tracking-tight">0</span>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1.5">{label}</p>
    </div>
  );
}

// ─── Component: GSAP Section Reveal ──────────────────────────────────────
function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
}

// ─── MAIN LANDING PAGE COMPONENT ─────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroContent = useRef<HTMLDivElement>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [activeAtsRole, setActiveAtsRole] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState("modern");

  // Hero Parallax Scroll Effect
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // GSAP Entrance Timeline on Mount
  useEffect(() => {
    const el = heroContent.current;
    if (!el) return;
    const items = el.querySelectorAll(".hero-item");
    const ctx = gsap.context(() => {
      gsap.fromTo(items,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.1 }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const currentRoleData = ATS_ROLES_SIMULATOR[activeAtsRole];

  return (
    <main className="flex flex-col min-h-screen bg-[#FAFAFA] text-gray-900">
      {/* ════════════════════════════════════════════════════════════════════
          1. HERO SECTION (INTERACTIVE 3D + GSAP)
         ════════════════════════════════════════════════════════════════════ */}
      <section id="product" ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white pt-24 pb-16">
        {/* Ambient mesh backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-200/30 via-indigo-100/40 to-purple-200/30 rounded-full blur-[130px] pointer-events-none" />

        {/* 3D Background Scene */}
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>

        {/* Hero Content Grid */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy Column */}
            <div ref={heroContent} className="lg:col-span-7 flex flex-col max-w-2xl">
              {/* Live Badge */}
              <div className="hero-item inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 border border-blue-200/60 shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span className="text-xs font-extrabold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  AI Resume Analyzer — Live Demo
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-item text-4xl sm:text-6xl lg:text-[68px] font-black text-gray-900 leading-[1.04] tracking-tight mb-6">
                Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">resumes</span> that clear ATS — and get noticed.
              </h1>

              {/* Sub-description */}
              <p className="hero-item text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                The next-generation career workspace powered by real-time ATS scoring, AI content rewriting, and automated LinkedIn sync.
              </p>

              {/* High-conversion CTAs */}
              <div className="hero-item flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/sign-up">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-9 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 border-none flex items-center justify-center transition-all hover:scale-[1.02]">
                    Build Free Resume <ArrowRight size={20} className="ml-2.5" />
                  </Button>
                </Link>
                <a href="#ats" className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl h-14 px-7 text-sm font-bold bg-white/90 hover:bg-white border-2 border-gray-200 text-gray-800 shadow-sm gap-2 transition-all hover:border-gray-300">
                  <Target size={18} className="text-blue-600" /> Try ATS Simulator
                </a>
              </div>

              {/* Value Signals */}
              <div className="hero-item flex flex-wrap items-center gap-6 text-xs font-bold text-gray-600 border-t border-gray-100 pt-6">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Built for ATS Parsing
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> No Credit Card Required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> PDF & DOCX Export
                </span>
              </div>
            </div>

            {/* Right Interactive Card / R3F Anchor space */}
            <div className="lg:col-span-5 hidden lg:block relative min-h-[460px]" aria-hidden="true" />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          2. METRIC STRIP & SOCIAL PROOF
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-white border-y border-gray-200/60 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCounter value={50} suffix="K+" label="Resumes Created" />
            <StatCounter value={87} suffix="%" label="Avg. ATS Score" />
            <StatCounter value={6} suffix="" label="Pro Templates" />
            <StatCounter value={12} suffix="+" label="Export Formats" />
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
              Trusted by job seekers applying to top companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 font-extrabold text-sm tracking-wider uppercase">
              <span className="hover:text-gray-800 transition-colors">FAANG</span>
              <span className="hover:text-gray-800 transition-colors">Fortune 500</span>
              <span className="hover:text-gray-800 transition-colors">Startups</span>
              <span className="hover:text-gray-800 transition-colors">Remote</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          3. FEATURE SHOWCASE — BENTO GRID
         ════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative w-full py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionReveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Full-Stack Resume Engine
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Everything you need to <span className="text-gradient-primary">stand out & win.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
                Smart automation, AI bullet rewrites, and instant job match gap analysis built into one powerful platform.
              </p>
            </div>
          </SectionReveal>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-auto">
            {/* ─── 1. LARGE — AI Resume Builder ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-4 md:row-span-2"
            >
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                        <BrainCircuit size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900">AI Resume Generator</h3>
                        <p className="text-xs text-gray-500">Generate industry-tailored content in seconds</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      AI Core
                    </span>
                  </div>

                  {/* Mini before/after demo */}
                  <div className="mt-2 grid grid-cols-2 gap-4 flex-1">
                    {/* Before */}
                    <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex flex-col">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-2">Before</span>
                      <p className="text-xs text-gray-400 italic leading-relaxed">
                        "Responsible for improving system performance and working on various projects."
                      </p>
                      <div className="mt-auto pt-3 flex items-center gap-1">
                        <XCircle size={12} className="text-rose-400" />
                        <span className="text-[9px] font-bold text-rose-500">Weak — No metrics</span>
                      </div>
                    </div>
                    {/* After */}
                    <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/60 p-4 flex flex-col">
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider mb-2">After ✦ AI Rewritten</span>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        "Reduced query latency by <span className="text-emerald-600 font-extrabold">40%</span> through distributed caching, serving <span className="text-emerald-600 font-extrabold">100K+</span> daily users."
                      </p>
                      <div className="mt-auto pt-3 flex items-center gap-1">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-600">Strong — Quantified impact</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">AI analyzes your experience and rewrites with hard metrics</span>
                    <span className="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      Try it <ChevronRight size={14} className="ml-1" />
                    </span>
                  </div>
                </div>
              </HoverCard>
            </motion.div>

            {/* ─── 2. LARGE TALL — ATS Match Analyzer ──────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="md:col-span-2 md:row-span-2"
            >
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col group">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                      <Search size={22} />
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Smart Scan
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 mb-1">ATS Match Analyzer</h3>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">Instantly scan against job postings for precision scoring.</p>

                  {/* Mini ATS score ring */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <motion.circle
                          initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                          whileInView={{ strokeDashoffset: 2 * Math.PI * 32 * 0.12 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          cx="40" cy="40" r="32" fill="none"
                          stroke="#10b981" strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-gray-900">88</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[{ label: "Keywords", val: 85 }, { label: "Format", val: 92 }, { label: "Impact", val: 78 }].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${s.val}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              className={`h-full rounded-full ${s.val > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-500 w-12 text-right">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick keyword chips */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {["React", "Python", "AWS"].map((kw) => (
                      <span key={kw} className="text-[9px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">✓ {kw}</span>
                    ))}
                    <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">+3 missing</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Analyze your resume <ChevronRight size={14} className="ml-1" />
                  </div>
                </div>
              </HoverCard>
            </motion.div>

            {/* ─── 3. MEDIUM — Job Gap Analytics ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3"
            >
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                      <LineChart size={20} />
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">Smart Gap</span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">Job Gap Analytics</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">Identify critical skill gaps against target roles.</p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-2">
                      {[
                        { label: "Docker", match: true },
                        { label: "Kubernetes", match: false },
                        { label: "GraphQL", match: true },
                        { label: "Terraform", match: false },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${s.match ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                          <span className={`text-xs font-bold ${s.match ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
                          {!s.match && <span className="text-[8px] font-bold text-amber-600 ml-auto">Missing ✦ Add</span>}
                        </div>
                      ))}
                    </div>
                    <div className="text-center px-3">
                      <span className="text-2xl font-black text-amber-500">62%</span>
                      <p className="text-[9px] font-bold text-gray-400">Match Rate</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                    Close the gap <ChevronRight size={14} className="ml-1" />
                  </div>
                </div>
              </HoverCard>
            </motion.div>

            {/* ─── 4. MEDIUM — ATS Pro Templates ──────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="md:col-span-3"
            >
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                      <Palette size={20} />
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">Pixel Perfect</span>
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">ATS Pro Templates</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">6 recruiter-approved, ATS-optimized designs.</p>

                  <div className="flex gap-3">
                    {[
                      { name: "Modern", color: "bg-blue-500" },
                      { name: "Pro", color: "bg-emerald-500" },
                      { name: "Creative", color: "bg-purple-500" },
                      { name: "Executive", color: "bg-rose-500" },
                      { name: "Minimal", color: "bg-gray-500" },
                      { name: "Student", color: "bg-amber-500" },
                    ].map((t) => (
                      <div key={t.name} className="flex flex-col items-center gap-1.5 flex-1 group/template">
                        <div className={`w-full aspect-[3/4] ${t.color} rounded-lg opacity-20 group-hover/template:opacity-40 transition-opacity border border-gray-200 flex items-center justify-center`}>
                          <FileText size={14} className="text-white opacity-0 group-hover/template:opacity-100" />
                        </div>
                        <span className="text-[8px] font-bold text-gray-400">{t.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                    Browse templates <ChevronRight size={14} className="ml-1" />
                  </div>
                </div>
              </HoverCard>
            </motion.div>

            {/* ─── 5-9. SMALL CARDS ───────────────────────────────────── */}
            {[
              { icon: RefreshCw, title: "Live Sync", desc: "LinkedIn & GitHub auto-update your resume.", gradient: "from-purple-600 to-pink-600", tag: "Auto", colSpan: 2 },
              { icon: Cloud, title: "Multi-Format Export", desc: "PDF, DOCX, HTML — one-click export.", gradient: "from-violet-600 to-purple-600", tag: "PDF/DOCX", colSpan: 2 },
              { icon: Zap, title: "Impact Rewriter", desc: "Weak bullets → quantified metrics.", gradient: "from-rose-500 to-pink-600", tag: "Rewrite", colSpan: 2 },
            ].map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2"
              >
                <HoverCard className="h-full">
                  <div className="h-full bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex items-start gap-4 group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-sm text-white shrink-0 group-hover:scale-110 transition-transform`}>
                      <feat.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-extrabold text-gray-900">{feat.title}</h4>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{feat.tag}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{feat.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </HoverCard>
              </motion.div>
            ))}

            {/* Privacy Shield + Mobile — side by side */}
            {[
              { icon: ShieldCheck, title: "Privacy Shield", desc: "Bank-grade encryption. Your data is never shared.", gradient: "from-teal-500 to-emerald-600", tag: "Encrypted" },
              { icon: Smartphone, title: "Mobile Studio", desc: "Full resume builder optimized for any device.", gradient: "from-sky-500 to-indigo-600", tag: "Responsive" },
            ].map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-3"
              >
                <HoverCard className="h-full">
                  <div className="h-full bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex items-start gap-4 group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-sm text-white shrink-0 group-hover:scale-110 transition-transform`}>
                      <feat.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-extrabold text-gray-900">{feat.title}</h4>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{feat.tag}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{feat.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                </HoverCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. INTERACTIVE ATS SCORE SIMULATOR
         ════════════════════════════════════════════════════════════════════ */}
      <section id="ats" className="relative w-full py-24 bg-white border-t border-gray-200/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-6">
              <SectionReveal>
                <span className="text-xs font-black tracking-[0.25em] text-emerald-600 uppercase mb-3 block">
                  Interactive Scanner Demo
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                  Simulate ATS scanning <br />
                  <span className="text-gradient-emerald">before you apply.</span>
                </h2>
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                  Applicant Tracking Systems reject over 70% of resumes before human recruiters see them. Our engine scans your content against real job descriptions to identify missing keywords instantly.
                </p>

                {/* Role selection buttons */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Select Target Role Simulator:</p>
                  <div className="flex flex-wrap gap-2">
                    {ATS_ROLES_SIMULATOR.map((r, idx) => (
                      <button
                        key={r.role}
                        onClick={() => setActiveAtsRole(idx)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                          activeAtsRole === idx
                            ? "bg-gray-900 text-white shadow-lg scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Target size={14} className={activeAtsRole === idx ? "text-emerald-400" : "text-gray-400"} />
                        {r.role}
                      </button>
                    ))}
                  </div>
                </div>

                <Link href="/sign-up">
                  <Button variant="accent" size="lg" className="rounded-2xl h-13 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-none shadow-lg shadow-emerald-500/20">
                    Scan My Resume Now <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </SectionReveal>
            </div>

            {/* Right Interactive Simulator Gauge Widget */}
            <div className="lg:col-span-6">
              <motion.div
                key={activeAtsRole}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-8 text-white shadow-2xl border border-gray-800 relative overflow-hidden"
              >
                {/* Background glow accent */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between pb-6 border-b border-gray-800">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Target Role Match</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{currentRoleData.role}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                    ATS Pass Guaranteed
                  </span>
                </div>

                {/* Score Gauge */}
                <div className="py-8 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
                      <motion.circle
                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - currentRoleData.score / 100) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        cx="60" cy="60" r="50" fill="none"
                        stroke="#10b981" strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 50} strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white leading-none">{currentRoleData.score}</span>
                      <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider mt-1">Match Score</span>
                    </div>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="w-full space-y-3.5">
                    {[
                      { label: "Keyword Match", val: currentRoleData.breakdown.keywords, color: "bg-emerald-500" },
                      { label: "Format Compliance", val: currentRoleData.breakdown.format, color: "bg-blue-500" },
                      { label: "Action Verbs", val: currentRoleData.breakdown.actionVerbs, color: "bg-purple-500" },
                      { label: "Quantified Impact", val: currentRoleData.breakdown.impactMetrics, color: "bg-amber-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
                          <span>{item.label}</span>
                          <span>{item.val}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyword Analysis Chips */}
                <div className="pt-6 border-t border-gray-800">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Detected Keywords Match:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentRoleData.keywordsMatched.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                        <CheckCircle size={12} className="text-emerald-400" /> {kw}
                      </span>
                    ))}
                    {currentRoleData.keywordsMissing.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 text-[11px] font-bold border border-rose-500/20">
                        <XCircle size={12} className="text-rose-400" /> Missing: {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. BUILT FOR EVERY STAGE OF YOUR JOURNEY
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-24 bg-white border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionReveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Built for every stage of your journey
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Pick your stage — <br className="sm:hidden" /> see your <span className="text-gradient-primary">custom strategy.</span>
              </h2>
              <p className="text-base text-gray-500">
                Every career level needs a different resume structure, keyword strategy, and section priority.
              </p>
            </div>
          </SectionReveal>

          {/* 4 Career Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAREER_STAGES.map((stage) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden"
              >
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${stage.gradient}`} />

                <div className="p-6 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center text-white shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <stage.icon size={26} />
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 mb-1.5">{stage.title}</h3>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
                    stage.label === 'Academic Focus' ? 'bg-emerald-100 text-emerald-700' :
                    stage.label === 'Skill Showcase' ? 'bg-sky-100 text-sky-700' :
                    stage.label === 'Entry-Level Pro' ? 'bg-purple-100 text-purple-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {stage.label}
                  </span>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{stage.desc}</p>

                  {/* Image preview */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                    <Image
                      src={stage.img}
                      alt={stage.title}
                      fill
                      className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Metric badge */}
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400">
                    <Target size={12} className="text-blue-500" />
                    {stage.metrics}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. TEMPLATE LAB — RESUME-FIRST SHOWCASE
         ════════════════════════════════════════════════════════════════════ */}
      <section id="templates" className="relative w-full py-24 bg-white border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionReveal>
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Interactive Resume Lab
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Recruiter-tested <span className="text-gradient-primary">templates.</span>
              </h2>
              <p className="text-base text-gray-500">
                Click any template to see your resume reformat instantly.
              </p>
            </div>
          </SectionReveal>

          {/* Minimalist Selector — inline pill tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTemplate === t.id
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                }`}
              >
                <t.icon size={14} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* Resume-Hero Preview — no chrome, just the document */}
          <div className="max-w-[620px] mx-auto">
            <motion.div
              key={activeTemplate}
              initial={{ opacity: 0, rotateY: -8, scale: 0.96 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
            >
              {/* Template name bar — minimal */}
              <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                  {TEMPLATES.find(t => t.id === activeTemplate)?.name} · {TEMPLATES.find(t => t.id === activeTemplate)?.desc}
                </span>
              </div>

              {/* Scrollable resume content */}
              <div className="p-6 md:p-10 max-h-[560px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {activeTemplate === "modern" && <Modern resume={SAMPLE_RESUME} />}
                {activeTemplate === "ats-professional" && <AtsProfessional resume={SAMPLE_RESUME} />}
                {activeTemplate === "creative" && <Creative resume={SAMPLE_RESUME} />}
                {activeTemplate === "executive" && <Executive resume={SAMPLE_RESUME} />}
              </div>
            </motion.div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/templates">
              <Button variant="accent" size="lg" className="rounded-2xl h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white font-bold">
                Explore All 6 Templates <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          7. PRICING SECTION (INTERACTIVE TOGGLE)
         ════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative w-full py-24 bg-[#FAFAFA] border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionReveal>
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Simple plans, <span className="text-gradient-primary">no hidden fees.</span>
              </h2>
              <p className="text-base text-gray-500 mb-8">
                Start for free and upgrade when you're ready to accelerate your interview callbacks.
              </p>

              {/* Monthly / Annual Toggle */}
              <div className="inline-flex items-center gap-3 bg-gray-200/80 p-1.5 rounded-full border border-gray-300">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    billingPeriod === "monthly" ? "bg-white text-gray-900 shadow-md" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingPeriod === "annual" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annual Billing
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-gray-900 text-[9px] font-black uppercase">
                    Save 25%
                  </span>
                </button>
              </div>
            </div>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => {
              const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                    plan.popular
                      ? "bg-gray-900 text-white shadow-2xl scale-105 border-2 border-blue-500 z-10"
                      : "bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                      Most Popular Plan
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold mb-1">{plan.name}</h3>
                    <p className={`text-xs mb-6 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>{plan.desc}</p>
                    
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black tracking-tight">${price}</span>
                      <span className={`text-xs font-semibold ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>/month</span>
                    </div>

                    <ul className="space-y-3.5 text-xs font-semibold mb-8">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className={plan.popular ? "text-emerald-400 shrink-0 mt-0.5" : "text-blue-600 shrink-0 mt-0.5"} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href={plan.href}>
                    <Button
                      variant={plan.popular ? "accent" : "secondary"}
                      className={`w-full rounded-2xl py-3.5 font-bold text-xs ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/30"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          8. HIGH-IMPACT 3D BOTTOM CTA
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-gray-950 text-white py-32 overflow-hidden">
        {/* 3D Interactive Floating Orbs Background */}
        <Suspense fallback={null}>
          <FloatingOrbs />
        </Suspense>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <span className="text-xs font-black tracking-[0.25em] text-blue-400 uppercase mb-4 block">
            Ready to Land Your Dream Role?
          </span>

          <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight tracking-tight">
            Your next interview is <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              one ATS resume away.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
            Join thousands of software engineers, product managers, and professionals building smarter resumes today.
          </p>

          <Link href="/sign-up">
            <Button variant="accent" size="lg" className="rounded-2xl h-14 px-10 text-base font-bold bg-white text-gray-950 hover:bg-gray-100 shadow-2xl border-none flex items-center justify-center transition-all hover:scale-105">
              Build My Resume Now <Rocket size={20} className="ml-2.5 text-blue-600" />
            </Button>
          </Link>

          <span className="text-xs text-gray-500 font-semibold mt-4">Free forever plan available • No credit card required</span>
        </div>
      </section>

      <Footer />
    </main>
  );
}
