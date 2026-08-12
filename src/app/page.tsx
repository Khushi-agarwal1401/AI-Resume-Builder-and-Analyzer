"use client";

import { useRef, useEffect, useCallback, useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";
import { sampleResumeFor } from "@/features/resume-builder/config/sample-resume";
import { Modern } from "@/features/resume-builder/templates/Modern";
import { AtsProfessional } from "@/features/resume-builder/templates/AtsProfessional";
import { Creative } from "@/features/resume-builder/templates/Creative";
import { Executive } from "@/features/resume-builder/templates/Executive";
import { ExecutiveSidebar } from "@/features/resume-builder/templates/ExecutiveSidebar";
import { ModernCard } from "@/features/resume-builder/templates/ModernCard";
import { Student } from "@/features/resume-builder/templates/Student";
import { Minimal } from "@/features/resume-builder/templates/Minimal";
import {
  ArrowRight, CheckCircle2, Sparkles, FileText,
  Briefcase, GraduationCap, Award, TrendingUp,
  Target, Palette, ChevronRight, BrainCircuit, ScrollText,
  Search, Rocket, Cloud, DownloadCloud, Scan, FileCheck,
  Zap, XCircle, CheckCircle, Minimize2,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Brand SVG icons (lucide v1 removed Github/Linkedin). Matches the GitHub
// integration page's inline-logo pattern.
function LinkedInIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

import { ResumeCardFan } from "@/components/landing/ResumeCardFan";
const PipelineEngineVisualizer = lazy(() => import("@/components/landing/PipelineEngineVisualizer").then(m => ({ default: m.PipelineEngineVisualizer })));
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AtsBadge, TierBadge } from "@/components/ui/AtsBadge";
import { getTemplateMetadata, templateAtsScore } from "@/features/resume-builder/config/template-registry";
import { getFamilyForTemplate } from "@/features/resume-builder/config/template-families";
const FloatingOrbs = lazy(() => import("@/components/3d/FloatingOrbs").then(m => ({ default: m.FloatingOrbs })));

// ─── Sample Resume Data ──────────────────────────────────────────────────

// ─── Data Collections ───────────────────────────────────────────────────


const CAREER_STAGES = [
  {
    id: "student",
    icon: GraduationCap,
    title: "Student",
    subtitle: "Showcase your academic achievements and projects.",
    img: "/images/student.png",
    label: "Student Template",
    iconBg: "bg-emerald-100/70 text-emerald-600",
    badgeBorder: "border-emerald-300 text-emerald-600",
    resume: {
      name: "Kshitij Das",
      role: "Computer Science Student",
      eduTitle: "Stanford University",
      eduSub: "Computer Science | 2021 - 2025",
      projTitle: "Student Management System",
      projDesc: "Built a full-stack web application using the MERN stack."
    }
  },
  {
    id: "internship",
    icon: Briefcase,
    title: "Internship",
    subtitle: "Highlight your internship experience and skills.",
    img: "/images/internship.png",
    label: "Internship Template",
    iconBg: "bg-sky-100/70 text-sky-600",
    badgeBorder: "border-sky-300 text-sky-600",
    resume: {
      name: "Khushi",
      role: "Software Engineering Intern",
      expTitle: "Google • SWE Intern",
      expDesc: "Developed search algorithms improving query response time by 15%.",
      skills: ["Python", "C++", "Java", "React"]
    }
  },
  {
    id: "fresher",
    icon: Sparkles,
    title: "Fresher",
    subtitle: "Stand out in your first job applications.",
    img: "/images/fresher.png",
    label: "Fresher Template",
    iconBg: "bg-violet-100/70 text-violet-600",
    badgeBorder: "border-violet-300 text-violet-600",
    resume: {
      name: "Radheshyam",
      role: "Junior Frontend Developer",
      summary: "Passionate developer with strong foundation in modern web technologies.",
      expTitle: "TechNova • Junior Dev",
      expDesc: "Implemented UI components for main product."
    }
  },
  {
    id: "experienced",
    icon: TrendingUp,
    title: "Experienced",
    subtitle: "Present your impact with measurable results.",
    img: "/images/experienced.png",
    label: "Professional Template",
    iconBg: "bg-rose-100/70 text-rose-600",
    badgeBorder: "border-rose-300 text-rose-600",
    resume: {
      name: "Ankit",
      role: "Senior Product Manager",
      expTitle: "Amazon • Sr. PM",
      expDesc: "Led cross-functional team of 15+ to launch Prime Video features.",
      expTitle2: "Microsoft • PM II",
      expDesc2: "Spearheaded Cloud dashboard redesign increasing engagement by 35%."
    }
  }
];

// Demo personas rotate the sample name so the template gallery shows a mix of
// resumes (Radheshyam / Khushi / Ankit) instead of the same person everywhere.
const TEMPLATES = [
  { id: "modern" as const, name: "Modern", sampleName: "Radheshyam Bhati" as const, icon: FileText, component: Modern, desc: "Clean, crisp spacing with accent highlights", categories: ["fresher", "experienced"] },
  { id: "ats-professional" as const, name: "ATS Pro", sampleName: "Khushi" as const, icon: ScrollText, component: AtsProfessional, desc: "Maximum ATS scanner parsing compatibility", categories: ["fresher", "experienced"] },
  { id: "creative" as const, name: "Creative", sampleName: "Ankit" as const, icon: Palette, component: Creative, desc: "Distinct visual layout for tech & design roles", categories: ["fresher", "experienced"] },
  { id: "executive" as const, name: "Executive", sampleName: "Radheshyam Bhati" as const, icon: Award, component: Executive, desc: "Structured layout for senior leadership & management", categories: ["experienced"] },
  { id: "executive-sidebar" as const, name: "Exec Sidebar", sampleName: "Khushi" as const, icon: Award, component: ExecutiveSidebar, desc: "Two-column sidebar with dark accents", categories: ["experienced"] },
  { id: "modern-card" as const, name: "Card Modern", sampleName: "Ankit" as const, icon: FileText, component: ModernCard, desc: "Rounded card-style sections with indigo chips", categories: ["fresher"] },
  { id: "student" as const, name: "Student", sampleName: "Radheshyam Bhati" as const, icon: GraduationCap, component: Student, desc: "Academic-focused layout spotlighting education & projects", categories: ["student"] },
  { id: "minimal" as const, name: "Minimal", sampleName: "Khushi" as const, icon: Minimize2, component: Minimal, desc: "Clean, distraction-free design with generous whitespace", categories: ["fresher"] },
];

const FILTER_TABS = [
  { id: "all", label: "All Templates", icon: FileText },
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "fresher", label: "Fresher", icon: Sparkles },
  { id: "experienced", label: "Experienced", icon: Award },
];

const WORKFLOW_STEPS = [
  { step: "01", title: "Import", desc: "Upload your existing resume or one-click sync your LinkedIn and GitHub profiles.", icon: DownloadCloud },
  { step: "02", title: "Build", desc: "Our AI engine analyzes your career history and rewrites bullets to maximize impact.", icon: Sparkles },
  { step: "03", title: "Analyze", desc: "Compare your resume against your target job description and exact ATS parsing rules.", icon: Scan },
  { step: "04", title: "Apply", desc: "Choose a recruiter-approved template and export to PDF or DOCX instantly.", icon: FileCheck }
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

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Priya Sharma",
    role: "Software Engineer",
    initials: "PS",
    color: "from-blue-500 to-indigo-600",
    quote: "I imported my GitHub projects and the AI turned them into proper resume bullets with metrics. The ATS check told me exactly which keywords I was missing before I applied.",
  },
  {
    id: "t2",
    name: "Rahul Verma",
    role: "Product Manager",
    initials: "RV",
    color: "from-violet-500 to-purple-600",
    quote: "The AI bullet rewriter is the reason my resume finally reads like a senior PM's. Every achievement now starts with an action verb and a real number I provided.",
  },
  {
    id: "t3",
    name: "Ananya Iyer",
    role: "Frontend Developer",
    initials: "AI",
    color: "from-emerald-500 to-teal-600",
    quote: "I pasted a job description and the analyzer showed my exact skill gap in seconds. One click added the missing keywords to my resume — then the PDF export was ready to send.",
  },
  {
    id: "t4",
    name: "Karan Mehta",
    role: "Data Analyst",
    initials: "KM",
    color: "from-amber-500 to-orange-600",
    quote: "The job tracker keeps my whole search in one place, and the cover letter generator drafts a solid first version from my resume and the JD. It saved me hours every week.",
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
    monthlyPrice: 199,
    annualPrice: 149,
    desc: "For active job seekers who want interviews guaranteed.",
    popular: true,
    features: ["Unlimited Resumes & Cover Letters", "Advanced AI ATS Match Simulator", "All 11 Premium Templates", "PDF + DOCX High-Res Export", "AI Action Verb & Metric Rewriter", "LinkedIn & GitHub Auto Sync"],
    cta: "Start Pro Trial",
    href: "/sign-up?plan=pro"
  },
  {
    name: "Executive",
    monthlyPrice: 299,
    annualPrice: 249,
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
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const workflowLineRef = useRef<HTMLDivElement>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [activeAtsRole, setActiveAtsRole] = useState(0);
  const [bulletTab, setBulletTab] = useState<"before" | "after">("after");
  const [exportSimState, setExportSimState] = useState<string | null>(null);
  const [copiedVerb, setCopiedVerb] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [galleryProgress, setGalleryProgress] = useState(0);

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

  // Vertical Scroll Sequence for Workflow Steps
  useEffect(() => {
    const section = workflowRef.current;
    const progressLine = workflowLineRef.current;
    if (!section || !progressLine) return;

    const ctx = gsap.context(() => {
      // Animate the vertical progress line height
      gsap.to(progressLine, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top center",
          end: "bottom center",
          scrub: true,
        }
      });

      // Animate individual steps as they come into view
      const steps = gsap.utils.toArray<HTMLElement>(".workflow-step");
      steps.forEach((step) => {
        const dot = step.querySelector(".workflow-dot");
        const content = step.querySelector(".workflow-content");

        // Dot pop animation
        gsap.to(dot, {
          backgroundColor: "#2563EB",
          borderColor: "#60A5FA",
          duration: 0.3,
          scrollTrigger: {
            trigger: step,
            start: "top center+=50",
            toggleActions: "play none none reverse",
          }
        });

        // Content reveal
        gsap.fromTo(content,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top center+=50",
              toggleActions: "play none none reverse",
            }
          }
        );
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // Horizontal Scroll Gallery for Resume Lab
  useEffect(() => {
    if (!galleryRef.current || !galleryTrackRef.current) return;
    const track = galleryTrackRef.current;

    // Kill any existing ScrollTrigger instances on gallery before re-creating
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars.trigger === galleryRef.current) st.kill();
    });

    const ctx = gsap.context(() => {
      if (window.innerWidth > 768) {
        const totalWidth = track.scrollWidth - window.innerWidth;
        // Add extra scroll room for smooth transition to next section
        const scrollDistance = Math.max(totalWidth, window.innerHeight * 2) + window.innerHeight;
        gsap.to(track, {
          x: -totalWidth,
          ease: "none",
          scrollTrigger: {
            trigger: pinRef.current,
            start: "top 72px",
            end: `+=${scrollDistance}`,
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setGalleryProgress(self.progress);
            },
          }
        });
      }
    });
    return () => ctx.revert();
  }, [templateFilter]);

  const currentRoleData = ATS_ROLES_SIMULATOR[activeAtsRole];
  const filteredTemplates = templateFilter === "all"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.categories.includes(templateFilter));
  const currentIndex = Math.min(
    Math.floor(galleryProgress * filteredTemplates.length),
    filteredTemplates.length - 1
  );
  const currentTemplate = filteredTemplates[currentIndex] || null;

  return (
    <main className="flex flex-col min-h-screen bg-[#FAFAFA] text-gray-900">
      {/* ════════════════════════════════════════════════════════════════════
          1. HERO SECTION (INTERACTIVE 3D + GSAP)
         ════════════════════════════════════════════════════════════════════ */}
      <section id="product" ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white pt-24 pb-16 dark:from-blue-500/10 dark:via-gray-950 dark:to-gray-950">
        {/* Ambient mesh backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-200/30 via-indigo-100/40 to-purple-200/30 rounded-full blur-[130px] pointer-events-none dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10" />

        {/* Hero Content Grid */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 py-12 lg:py-20">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy Column */}
            <div ref={heroContent} className="lg:col-span-7 flex flex-col max-w-2xl">
              {/* Live Badge */}
              <div className="hero-item inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 border border-blue-200/60 shadow-sm dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 dark:border-blue-500/30">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span className="text-xs font-extrabold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
                  AI LLM Engine 4.0 Released
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-item text-4xl sm:text-6xl lg:text-[68px] font-black text-gray-900 leading-[1.04] tracking-tight mb-6">
                Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">resumes</span> that clear ATS and get noticed.
              </h1>

              {/* Sub-description */}
              <p className="hero-item text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                The next-generation career workspace powered by real-time ATS scoring, AI content rewriting, and automated LinkedIn sync.
              </p>

              {/* High-conversion CTAs */}
              <div className="hero-item flex flex-col sm:flex-row gap-4 mb-4">
                <Link href="/sign-up">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-9 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 border-none flex items-center justify-center transition-all hover:scale-[1.02]">
                    Build Free Resume <ArrowRight size={20} className="ml-2.5" />
                  </Button>
                </Link>
                <a href="#ats" className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl h-14 px-7 text-sm font-bold bg-white/90 hover:bg-white border-2 border-gray-200 text-gray-800 shadow-sm gap-2 transition-all hover:border-gray-300 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <Target size={18} className="text-blue-600" /> Try ATS Simulator
                </a>
              </div>

              {/* A-05: Hero import CTAs — one-click LinkedIn / GitHub import */}
              <div className="hero-item flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/sign-up?source=linkedin-import"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl h-11 px-5 text-sm font-bold bg-[#0A66C2] hover:bg-[#084F96] text-white shadow-md transition-all hover:scale-[1.02]"
                >
                  <LinkedInIcon /> Import from LinkedIn
                </Link>
                <Link
                  href="/sign-up?source=github-import"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl h-11 px-5 text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all hover:scale-[1.02]"
                >
                  <GitHubIcon /> Import from GitHub
                </Link>
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

            {/* Right Column: CVAurum-style Live Resume Card Fan */}
            <div className="lg:col-span-5 relative w-full h-[560px] hidden lg:flex items-center justify-center">
              <ErrorBoundary>
                <ResumeCardFan />
              </ErrorBoundary>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          WORKFLOW SEQUENCE (VERTICAL STEP-BY-STEP STORYTELLING)
         ════════════════════════════════════════════════════════════════════ */}
      <section ref={workflowRef} className="relative w-full bg-[#FAFAFA] py-32 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 md:px-12">

          <div className="text-center mb-24">
            <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
              The Complete Process
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-6">
              From job description to application-ready resume.
            </h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
              Our AI-driven pipeline optimizes every stage of the resume building process, ensuring you stand out to both recruiters and ATS algorithms.
            </p>
          </div>

          <div className="relative pl-8 md:pl-0">
            {/* The vertical track line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-gray-200 -translate-x-1/2 rounded-full" />

            {/* The animated progress line */}
            <div ref={workflowLineRef} className="absolute left-8 md:left-1/2 top-0 w-[2px] bg-blue-600 -translate-x-1/2 origin-top rounded-full" style={{ height: "0%" }} />

            {/* Workflow steps */}
            <div className="space-y-24">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={step.step} className={`workflow-step relative flex flex-col md:flex-row items-start ${isEven ? "md:flex-row-reverse" : ""} gap-8 md:gap-16`}>

                    {/* Center Dot Indicator */}
                    <div className="absolute left-0 md:left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-[3px] bg-gray-200 border-gray-300 z-10 flex items-center justify-center workflow-dot shadow-sm transition-colors duration-300">
                      <step.icon size={18} className="text-white" />
                    </div>

                    {/* Content Box */}
                    <div className={`workflow-content w-full md:w-1/2 ${isEven ? "md:pl-16 text-left" : "md:pr-16 md:text-right"}`}>
                      <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-8 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 relative group overflow-hidden">
                        <div className="text-[10px] font-black text-blue-600 tracking-widest mb-3">{step.step}</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4">{step.title}</h3>
                        <p className="text-gray-500 leading-relaxed font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          <div className="mt-24 text-center">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="rounded-2xl h-14 px-8 bg-gray-900 hover:bg-gray-800 text-white font-bold inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95">
                Start Building For Free <ArrowRight size={20} />
              </Button>
            </Link>
          </div>

        </div>
      </section>



      {/* ════════════════════════════════════════════════════════════════════           3. FEATURE SHOWCASE - BENTO GRID 2.0 (INTERACTIVE)
         
         ════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative w-full py-24 bg-gradient-to-b from-[#FAFAFA] via-white to-[#FAFAFA] border-y border-gray-200/60 overflow-hidden dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Background Mesh Glows */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <SectionReveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Next-Gen Career Intelligence
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">stand out & win.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
                Experience real-time AI bullet rewrites, interactive ATS match gauges, live gap analysis, and 1-click multi-format exports.
              </p>
            </div>
          </SectionReveal>

          {/* Bento Grid 2.0 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">

            {/* ─── 1. LARGE HERO CARD: INTERACTIVE BEFORE/AFTER AI BULLET REWRITER (7 Cols) ─── */}
            <div className="md:col-span-7 md:row-span-2">
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-md hover:shadow-2xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                  {/* Subtle top glow bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500" />

                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                          <BrainCircuit size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">AI Bullet Rewriter</h3>
                          <p className="text-xs font-medium text-gray-400">Transforms weak bullet points into hard metrics</p>
                        </div>
                      </div>

                      {/* Interactive Tab Switcher */}
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                          onClick={() => setBulletTab("before")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${bulletTab === "before" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                          Raw Draft
                        </button>
                        <button
                          onClick={() => setBulletTab("after")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${bulletTab === "after" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20" : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                          <Sparkles size={12} /> AI Rewritten
                        </button>
                      </div>
                    </div>

                    {/* Interactive Display Area */}
                    <div className="min-h-[170px] bg-[#F8FAFC] rounded-2xl p-5 border border-gray-200/80 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
                      {bulletTab === "before" ? (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                              ✗ Weak Bullet (No Metrics)
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Score: 42/100</span>
                          </div>
                          <p className="text-sm font-medium text-gray-500 italic leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200/60">
                            "Responsible for improving backend API system performance and working on user database optimization."
                          </p>
                          <div className="flex items-center gap-2 text-xs text-rose-600 font-bold">
                            <XCircle size={14} /> Missing quantified results, action verbs, and platform scale.
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                              <Sparkles size={12} /> ✦ AI Rewritten (+48% ATS Lift)
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">Score: 98/100</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 leading-relaxed bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm">
                            "Architected React & Node.js microservices reducing API query latency by <span className="text-blue-600 font-black">42%</span> and boosting throughput for <span className="text-blue-600 font-black">100K+</span> daily active users."
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs font-bold text-emerald-600">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px]">
                              <CheckCircle size={12} /> Quantified Impact Added
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                              <CheckCircle size={12} /> Strong Action Verbs
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Click tabs above to preview live AI transformation</span>
                    <button
                      onClick={() => setBulletTab(bulletTab === "before" ? "after" : "before")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-transform group-hover:translate-x-1"
                    >
                      Toggle Demo <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </HoverCard>
            </div>

            {/* ─── 2. ATS MATCH GAUGE (5 Cols) ─── */}
            <div className="md:col-span-5 md:row-span-2">
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-md hover:shadow-2xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                        <Search size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live Scanner
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-1">ATS Match Analyzer</h3>
                    <p className="text-xs font-medium text-gray-400 mb-6">Real-time keyword matching & format compliance radar</p>

                    {/* Circular Score & Bars */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-200/80 flex items-center gap-5 mb-5">
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                          <motion.circle
                            initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                            whileInView={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - 0.94) }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            cx="40" cy="40" r="32" fill="none"
                            stroke="#10b981" strokeWidth="7"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-gray-900 leading-none">94%</span>
                          <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Match</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        {[
                          { label: "Keyword Match", val: 95, color: "bg-emerald-500" },
                          { label: "ATS Layout", val: 98, color: "bg-blue-500" },
                          { label: "Impact Verbs", val: 91, color: "bg-purple-500" },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-0.5">
                              <span>{m.label}</span>
                              <span>{m.val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${m.val}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className={`h-full ${m.color} rounded-full`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detected Keyword Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {["React", "TypeScript", "Node.js", "GraphQL", "AWS"].map((kw) => (
                        <span key={kw} className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ {kw}
                        </span>
                      ))}
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        ⚠ Docker missing
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Real-time match analysis — score depends on your content</span>
                    <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                      Scan Now <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </HoverCard>
            </div>

            {/* ─── 3. INTERACTIVE MULTI-FORMAT EXPORT (6 Cols) ─── */}
            <div className="md:col-span-6">
              <HoverCard className="h-full">
                <div className="h-full bg-white rounded-3xl p-7 border border-gray-200/80 shadow-md hover:shadow-2xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md text-white group-hover:scale-110 transition-transform">
                        <Cloud size={22} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Instant Export
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 mb-1">1-Click Multi-Format Download</h3>
                    <p className="text-xs text-gray-400 mb-5">Export pixel-perfect PDF, DOCX, or HTML with crisp ATS typography.</p>

                    {/* Interactive Export Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { fmt: "PDF", label: "ATS PDF", color: "hover:border-red-500 hover:text-red-600 bg-red-50/50 text-red-700" },
                        { fmt: "DOCX", label: "MS Word", color: "hover:border-blue-500 hover:text-blue-600 bg-blue-50/50 text-blue-700" },
                        { fmt: "HTML", label: "Web Link", color: "hover:border-purple-500 hover:text-purple-600 bg-purple-50/50 text-purple-700" },
                      ].map((item) => (
                        <button
                          key={item.fmt}
                          onClick={() => {
                            setExportSimState(item.fmt);
                            setTimeout(() => setExportSimState(null), 2000);
                          }}
                          className={`p-3.5 rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${item.color}`}
                        >
                          <FileText size={20} />
                          <span className="text-xs font-black">{item.fmt}</span>
                          <span className="text-[9px] font-bold text-gray-400">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Feedback Alert Toast */}
                    {exportSimState && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Exporting {exportSimState} file (ATS Optimized)...
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </HoverCard>
            </div>

            {/* ─── 4. AUTOMATED LINKEDIN & GITHUB SYNC ANIMATED PIPELINE (12 Cols) ─── */}
            <div className="md:col-span-12">
              <ErrorBoundary>
                <PipelineEngineVisualizer />
              </ErrorBoundary>
            </div>

            {/* ─── 5. INTERACTIVE ACTION VERB BOOSTER (12 Cols) ─── */}
            <div className="md:col-span-12">
              <HoverCard className="h-full">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-7 sm:p-9 text-white shadow-2xl relative overflow-hidden border border-blue-700/40 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Backdrop glow */}
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-[10px] font-black uppercase tracking-wider mb-3 border border-white/10">
                      <Zap size={12} className="text-amber-400" /> High-Impact Action Verb Library
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Boost Your Resume Bullets Instantly</h3>
                    <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                      Click any recruiter-preferred action verb to copy it directly to your clipboard for your resume bullet points.
                    </p>
                  </div>

                  {/* Clickable Action Verbs Chips */}
                  <div className="flex flex-wrap items-center justify-end gap-2 max-w-md">
                    {["Architected", "Spearheaded", "Quantified", "Orchestrated", "Engineered", "Optimized", "Pioneered", "Accelerated"].map((verb) => (
                      <button
                        key={verb}
                        onClick={() => {
                          navigator.clipboard.writeText(verb);
                          setCopiedVerb(verb);
                          setTimeout(() => setCopiedVerb(null), 2000);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/15 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedVerb === verb ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Sparkles size={12} className="text-blue-400" />}
                        {verb}
                      </button>
                    ))}
                  </div>
                </div>
              </HoverCard>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. INTERACTIVE ATS SCORE SIMULATOR (SIDE-BY-SIDE REAL RESUME & AI SCANNER)
         ════════════════════════════════════════════════════════════════════ */}
      <section id="ats" className="relative w-full py-24 bg-white border-t border-gray-200/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Section Header */}
          <SectionReveal>
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-emerald-600 uppercase mb-3 block">                 AI Resume Analyzer - Live Demo
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
                Simulate AI ATS scanning <br />
                <span className="text-gradient-emerald">on a real resume in real-time.</span>
              </h2>
              <p className="text-base text-gray-600 leading-relaxed mb-6">
                Watch how our AI engine parses written resume sections, detects industry keywords, and calculates ATS compatibility scores live.
              </p>

              {/* Target Role Selector Tabs */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                {ATS_ROLES_SIMULATOR.map((r, idx) => (
                  <button
                    key={r.role}
                    onClick={() => setActiveAtsRole(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeAtsRole === idx
                      ? "bg-gray-900 text-white shadow-md scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                      }`}
                  >
                    <Target size={14} className={activeAtsRole === idx ? "text-emerald-400" : "text-gray-400"} />
                    {r.role}
                  </button>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* Side-By-Side Demo: Left (Real Written Resume + Laser Scan) | Right (Live ATS Score Card) */}
          <div className="grid lg:grid-cols-12 gap-8 items-stretch mt-8">

            {/* ─── LEFT COLUMN: REAL WRITTEN RESUME WITH LIVE LASER SCANNER ─── */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-2xl overflow-hidden font-sans h-full flex flex-col justify-between">

                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-black uppercase text-gray-800 tracking-wider">AI Scanner Active</span>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Role: {currentRoleData.role}
                  </span>
                </div>

                {/* Real Rendered Resume Document */}
                <div className="relative bg-[#FAFAFA] border border-gray-200 rounded-2xl p-6 shadow-inner text-gray-900 text-left flex-1 overflow-hidden">

                  {/* Animated Laser Scanning Line sweeping top to bottom */}
                  <motion.div
                    animate={{ y: [0, 310, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_18px_4px_rgba(16,185,129,0.85)] z-20 pointer-events-none"
                  >
                    {/* Laser beam trailing glow gradient */}
                    <div className="h-16 bg-gradient-to-b from-emerald-500/15 to-transparent w-full -translate-y-16 pointer-events-none" />
                  </motion.div>

                  {/* Header Info */}
                  <div className="border-b border-gray-200 pb-3 mb-3">
                    <h4 className="text-xl font-black text-gray-900 tracking-tight">Radheshyam Bhati</h4>
                    <p className="text-xs font-extrabold text-blue-600 mb-1">Senior Software Engineer</p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      radheshyam@email.com • +91 98765 43210 • San Francisco, CA • linkedin.com/in/radheshyam
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="mb-3">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Professional Summary</h5>
                    <p className="text-[11px] text-gray-700 leading-relaxed font-normal">
                      Results-driven Software Engineer with 5+ years building scalable microservices and web applications. Expert in <span className="bg-emerald-100/90 text-emerald-800 font-bold px-1 rounded border border-emerald-300">React</span>, <span className="bg-emerald-100/90 text-emerald-800 font-bold px-1 rounded border border-emerald-300">TypeScript</span>, and cloud backend architecture.
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="mb-3">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Work Experience</h5>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-black text-gray-900">TechNova Solutions - Senior Engineer</span>
                          <span className="text-[9px] font-bold text-gray-400">2023 – Present</span>
                        </div>
                        <ul className="text-[10px] text-gray-600 space-y-1 mt-1 pl-3 list-disc">
                          <li>Architected microservices using <span className="bg-emerald-100/90 text-emerald-800 font-bold px-1 rounded border border-emerald-300">Node.js</span> & <span className="bg-emerald-100/90 text-emerald-800 font-bold px-1 rounded border border-emerald-300">AWS</span> handling 100K+ daily active users.</li>
                          <li>Optimized PostgreSQL queries, improving throughput by 42% and latency by 120ms.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Skills Tag Pills */}
                  <div>
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Technical Skills</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {["React", "TypeScript", "Node.js", "Python", "AWS", "GraphQL", "PostgreSQL", "CI/CD"].map((skill) => {
                        const isMatched = currentRoleData.keywordsMatched.includes(skill);
                        return (
                          <span
                            key={skill}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all duration-300 ${isMatched
                              ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300"
                              : "bg-gray-200 text-gray-600"
                              }`}
                          >
                            {isMatched ? `✓ ${skill}` : skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay Toast */}
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-500" /> Live Resume Parsing Code Verified
                  </span>
                  <span className="text-emerald-600 font-black">{currentRoleData.keywordsMatched.length} Keywords Matched</span>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: LIVE ATS SCORE DASHBOARD ─── */}
            <div className="lg:col-span-6 flex flex-col">
              <motion.div
                key={activeAtsRole}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-b from-gray-900 via-gray-950 to-gray-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-gray-800 relative overflow-hidden h-full flex flex-col justify-between"
              >
                {/* Background glow accent */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-gray-800">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Target Role Match</span>
                      <h3 className="text-xl font-bold text-white mt-0.5">{currentRoleData.role}</h3>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                      Estimated Compatibility
                    </span>
                  </div>

                  {/* Score Gauge & Breakdown */}
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
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800">
                  <Link href="/sign-up">
                    <Button variant="accent" size="lg" className="w-full rounded-2xl h-13 bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-none shadow-xl shadow-emerald-500/25 flex items-center justify-center">
                      Scan Your Resume Now <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          5. BUILT FOR EVERY STAGE OF YOUR JOURNEY
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full py-20 bg-white border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Section Badge */}
          <SectionReveal>
            <div className="text-center mb-10">
              <span className="text-[11px] font-bold tracking-[0.2em] text-blue-600 uppercase block">
                BUILT FOR EVERY STAGE OF YOUR JOURNEY
              </span>
            </div>
          </SectionReveal>

          {/* 4 Career Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {CAREER_STAGES.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
              >
                {/* Top Info Row */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <card.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-0.5">{card.title}</h3>
                    <p className="text-[11px] text-gray-400 font-medium leading-snug">{card.subtitle}</p>
                  </div>
                </div>

                {/* Main Visual Box */}
                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100 relative min-h-[220px] flex flex-col justify-between overflow-hidden">

                  {/* Floating Mini Resume */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 w-[72%] flex flex-col gap-1.5 z-0 transition-transform duration-300 group-hover:-translate-y-1">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                      <div>
                        <div className="text-[9px] font-extrabold text-gray-900 leading-none">{card.resume.name}</div>
                        <div className="text-[7px] font-medium text-gray-400 leading-none mt-0.5">{card.resume.role}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}>
                        <card.icon size={9} />
                      </div>
                    </div>

                    {/* Student Content */}
                    {card.id === "student" && (
                      <div className="space-y-1 text-[6px]">
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Education</div>
                          <div className="font-bold text-gray-800">{card.resume.eduTitle}</div>
                          <div className="text-gray-400">{card.resume.eduSub}</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Projects</div>
                          <div className="font-bold text-gray-800">{card.resume.projTitle}</div>
                          <div className="text-gray-500 leading-tight">{card.resume.projDesc}</div>
                        </div>
                      </div>
                    )}

                    {/* Internship Content */}
                    {card.id === "internship" && (
                      <div className="space-y-1 text-[6px]">
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Experience</div>
                          <div className="font-bold text-gray-800">{card.resume.expTitle}</div>
                          <div className="text-gray-500 leading-tight">{card.resume.expDesc}</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Skills</div>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {card.resume.skills?.map(s => (
                              <span key={s} className="px-1 py-0.5 rounded bg-gray-100 text-gray-600 text-[5px] font-bold">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fresher Content */}
                    {card.id === "fresher" && (
                      <div className="space-y-1 text-[6px]">
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Summary</div>
                          <div className="text-gray-500 leading-tight">{card.resume.summary}</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Experience</div>
                          <div className="font-bold text-gray-800">{card.resume.expTitle}</div>
                          <div className="text-gray-500 leading-tight">{card.resume.expDesc}</div>
                        </div>
                      </div>
                    )}

                    {/* Experienced Content */}
                    {card.id === "experienced" && (
                      <div className="space-y-1 text-[6px]">
                        <div>
                          <div className="font-bold text-gray-700 uppercase tracking-wide text-[5px]">Experience</div>
                          <div className="font-bold text-gray-800">{card.resume.expTitle}</div>
                          <div className="text-gray-500 leading-tight">{card.resume.expDesc}</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{card.resume.expTitle2}</div>
                          <div className="text-gray-500 leading-tight">{card.resume.expDesc2}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Person Cutout Image */}
                  <div className="absolute bottom-0 right-0 w-28 h-36 flex items-end justify-end z-10 pointer-events-none">
                    <Image
                      src={card.img}
                      alt={card.title}
                      width={110}
                      height={140}
                      className="object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 origin-bottom"
                    />
                  </div>

                  {/* Bottom Pill Badge */}
                  <div className="mt-4 z-20">
                    <span className={`text-[10px] font-bold px-3.5 py-1.5 rounded-full bg-white border shadow-sm ${card.badgeBorder}`}>
                      {card.label}
                    </span>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════           6. TEMPLATE LAB - RESUME-FIRST SHOWCASE
         ════════════════════════════════════════════════════════════════════ */}
      <section id="templates" className="relative w-full py-24 bg-white border-t border-gray-200/70">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <SectionReveal>
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Interactive Resume Lab
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Recruiter-tested <span className="text-gradient-primary">templates.</span>
              </h2>
              <p className="text-base text-gray-500 mb-0">
                Click any template to see your resume reformat instantly.
              </p>
            </div>
          </SectionReveal>

          {/* ── Pin Container for Filters & Gallery ── */}
          <div ref={pinRef} className="w-full">
            {/* ── Career Stage Filter Tabs ── */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTemplateFilter(tab.id);
                    setGalleryProgress(0);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    templateFilter === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div ref={galleryRef} className="h-[75vh] flex items-center overflow-hidden w-full hidden md:flex rounded-2xl">
              <div ref={galleryTrackRef} className="flex gap-10 px-6 sm:px-12 w-max">
                {filteredTemplates.map((t) => (
                <div key={t.id} className="w-[800px] h-[500px] bg-white rounded-3xl p-6 flex gap-6 border border-gray-200 shadow-xl shrink-0">
                  <div className="w-[190px] shrink-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                      <t.icon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{t.name}</h3>
                    <p className="text-[11px] text-gray-500 mb-3 font-medium leading-relaxed">{t.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <AtsBadge score={templateAtsScore(t.id)} />
                      <TierBadge tier={getTemplateMetadata(t.id)?.tier ?? "free"} />
                      {getFamilyForTemplate(t.id) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-[10px] font-bold">
                          {getFamilyForTemplate(t.id)?.name}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1.5 text-[11px] font-bold text-gray-700">
                      <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> {getTemplateMetadata(t.id)?.atsLabel ?? "Recruiter Approved"}</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue-600 shrink-0" /> Best for {getTemplateMetadata(t.id)?.levels.slice(0, 2).map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(" · ")}</li>
                    </ul>
                    <div className="mt-4">
                      <Link href="/templates">
                        <Button variant="accent" className="rounded-xl h-8 px-4 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold">
                          Use Template
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner flex items-start justify-center pt-6 px-6 pb-6 overflow-hidden">
                    {/* Exact A4 dimensions using CSS zoom to shrink perfectly without layout bugs */}
                    <div 
                      className="bg-white shadow-xl shrink-0 overflow-hidden p-10 box-border text-left"
                      style={{ width: '210mm', height: '297mm', zoom: 0.45 }}
                    >
                      <t.component resume={sampleResumeFor(t.sampleName)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Scroll Progress Indicator ── */}
          <div className="flex flex-col items-center gap-3 mt-2 print:hidden">
            {/* Progress Bar */}
            <div className="w-full max-w-md h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                style={{ width: `${Math.max(galleryProgress * 100, 2)}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            {/* Dots + Template Name */}
            <div className="flex items-center gap-4">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {filteredTemplates.map((t, idx) => (
                  <span
                    key={t.id}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "bg-blue-600 scale-125 shadow-sm shadow-blue-400"
                        : idx < currentIndex
                          ? "bg-blue-300"
                          : "bg-gray-300"
                    }`}
                    title={t.name}
                  />
                ))}
              </div>

              {/* Template Counter */}
              <span className="text-xs font-bold text-gray-400 tabular-nums tracking-wide">
                {currentTemplate ? (
                  <>
                    <span className="text-gray-700">{currentTemplate.name}</span>
                    <span className="mx-1.5">-</span>
                    <span>{currentIndex + 1}</span>
                    <span className="mx-0.5">/</span>
                    <span>{filteredTemplates.length}</span>
                  </>
                ) : (
                  <span className="text-gray-300">0 / {filteredTemplates.length}</span>
                )}
              </span>
            </div>
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════════
          SUCCESS STORIES - TESTIMONIALS
         ════════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative w-full py-24 bg-white border-t border-gray-200/70 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <SectionReveal>
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <span className="text-xs font-black tracking-[0.25em] text-blue-600 uppercase mb-3 block">
                Success Stories
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Job seekers who <span className="text-gradient-primary">landed interviews.</span>
              </h2>
              <p className="text-base text-gray-500">
                Real results from people who built their resumes here and got callbacks.
              </p>
            </div>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <SectionReveal key={t.id} className={idx > 1 ? "lg:mt-8" : ""}>
                <div className="h-full bg-white rounded-3xl p-7 border border-gray-200/80 shadow-md hover:shadow-2xl hover:border-blue-200 transition-all duration-300 flex flex-col relative overflow-hidden group">
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", t.color)} />
                  <div className="text-4xl font-black text-blue-100 leading-none mb-4 select-none">“</div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {t.quote}
                  </p>
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br text-white flex items-center justify-center text-xs font-black shrink-0", t.color)}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{t.name}</p>
                      <p className="text-[11px] font-medium text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            ))}
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
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${billingPeriod === "monthly" ? "bg-white text-gray-900 shadow-md" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${billingPeriod === "annual" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">              {PLANS.map((plan) => {
              const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${plan.popular
                    ? "bg-gray-900 text-white shadow-2xl scale-105 border-2 border-blue-500 z-10"
                    : "bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow-xl"
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-md text-center whitespace-nowrap">
                      Most Popular Plan
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold mb-1">{plan.name}</h3>
                    <p className={`text-xs mb-6 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>{plan.desc}</p>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-black tracking-tight">₹{price}</span>
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
                      className={`w-full rounded-2xl py-3.5 font-bold text-xs ${plan.popular
                        ? "bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/30"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200"
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          8. HIGH-IMPACT 3D BOTTOM CTA
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full bg-gray-950 text-white py-32 overflow-hidden">
        {/* 3D Interactive Floating Orbs Background */}            <Suspense fallback={null}>
              <ErrorBoundary>
                <FloatingOrbs />
              </ErrorBoundary>
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

          <span className="text-xs text-gray-500 font-semibold mt-4">Free forever plan available </span>
        </div>
      </section>

      <Footer />
    </main>
  );
}
