"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Wand2, 
  Star,
  ArrowRight,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  Target,
  ChevronRight,
  Search,
  Globe,
  BookOpen,
} from "lucide-react";
import { FaGithub, FaQuoteLeft } from "react-icons/fa";
import { useRef, useState } from "react";
import { Hero3DScene } from "@/components/3d/Hero3DScene";
import type { ResumeCategory } from "@/services/resume-analyzer/ats-scorer";

// ─── Category Selector ───────────────────────────────────────
const CATEGORIES: { id: ResumeCategory; label: string; icon: string; tagline: string }[] = [
  { id: "student", label: "Student", icon: "🎓", tagline: "Build your first career-ready resume" },
  { id: "fresher", label: "Fresher", icon: "🚀", tagline: "Land your first full-time role" },
  { id: "experienced", label: "Experienced", icon: "💼", tagline: "Advance to senior leadership" },
  { id: "internship", label: "Internship", icon: "📋", tagline: "Stand out from other applicants" },
];

const CATEGORY_HERO_CONTENT: Record<ResumeCategory, { title: string; desc: string }> = {
  student: {
    title: "Build an academic resume that opens doors.",
    desc: "Showcase your GPA, projects, coursework, and extracurriculars. Our AI knows exactly what intern coordinators and university recruiters look for.",
  },
  fresher: {
    title: "Turn projects into job offers.",
    desc: "Bridge the experience gap with AI-powered bullet points, project highlights, and skills you actually learned — even without years of work history.",
  },
  experienced: {
    title: "Resumes that senior recruiters respect.",
    desc: "Quantify your leadership impact, optimize for ATS keyword matching, and get tailored suggestions for executive and senior-level roles.",
  },
  internship: {
    title: "Land that internship, not just another application.",
    desc: "Highlight relevant coursework, academic projects, and enthusiasm. Our ATS is tuned for how internship programs evaluate candidates.",
  },
};

// ─── Hero Interactive Mockup ─────────────────────────────────
function HeroMockup({ category }: { category: ResumeCategory }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const atsScore = category === "experienced" ? 94 : category === "fresher" ? 88 : category === "student" ? 82 : 85;

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-1000 z-10">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className="relative w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden transform-style-3d cursor-crosshair"
      >
        {/* Mac-style traffic lights */}
        <div className="flex gap-1.5 px-4 pt-3 pb-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>

        {/* Resume Preview */}
        <div className="p-5 pt-2">
          <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="w-36 h-5 bg-gray-800 rounded" />
                <div className="w-24 h-3 bg-gray-300 rounded mt-1.5" />
              </div>
              <div className="flex -space-x-1">
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-xs">LI</div>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">GH</div>
              </div>
            </div>

            {/* ATS Score Bar */}
            <div className="bg-gradient-to-r from-accent-500/10 to-accent-500/5 rounded-lg p-3 border border-accent-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-micro font-semibold text-gray-500 uppercase tracking-wider">ATS Match</span>
                <span className="text-small font-bold text-accent-600">{atsScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${atsScore}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
                />
              </div>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <div className="w-16 h-3 bg-gray-800 rounded" />
              <div className="w-full h-2 bg-gray-100 rounded" />
              <div className="w-5/6 h-2 bg-gray-100 rounded" />
              <div className="w-4/5 h-2 bg-gray-100 rounded" />
            </div>

            <div className="space-y-2">
              <div className="w-20 h-3 bg-gray-800 rounded" />
              <div className="flex items-start gap-2">
                <span className="text-accent-500 text-xs mt-0.5">•</span>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2 bg-gray-100 rounded" />
                  <div className="w-3/4 h-2 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-500 text-xs mt-0.5">•</span>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2 bg-gray-100 rounded" />
                  <div className="w-5/6 h-2 bg-gray-100 rounded" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["React", "TS", "Python", "SQL", "AWS"].map((skill) => (
                <span key={skill} className="text-micro px-2 py-0.5 bg-gray-100 rounded text-gray-500">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Badges */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-3 -right-3 bg-white border border-accent-500/30 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5"
        >
          <Sparkles size={12} className="text-accent-500" />
          <span className="text-micro font-bold text-accent-600">AI Optimized</span>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 -left-10 bg-white border border-gray-200 p-2.5 rounded-xl shadow-xl flex items-center gap-2"
        >
          <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
            <TrendingUp size={14} />
          </div>
          <div>
            <p className="text-micro font-semibold text-black leading-tight">+{category === "student" ? "40" : category === "fresher" ? "55" : "35"}%</p>
            <p className="text-[10px] text-gray-500 leading-tight">callback rate</p>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-16 -right-8 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-xl"
        >
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Top rated by {category === "student" ? "graduates" : category === "internship" ? "interns" : "professionals"}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Category Tabs Component ─────────────────────────────────
function CategoryTabs({ active, onChange }: { active: ResumeCategory; onChange: (c: ResumeCategory) => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`relative px-4 py-2 rounded-full text-small font-medium transition-all duration-200 ${
            active === cat.id
              ? "bg-accent-500 text-black shadow-sm"
              : "text-gray-500 hover:text-black hover:bg-gray-50"
          }`}
        >
          <span className="mr-1">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Live ATS Demo ────────────────────────────────────────────
function LiveAtsDemo() {
  const [demoText, setDemoText] = useState("");
  const [demoScore, setDemoScore] = useState(0);

  const sampleResumes = [
    "Led a team of 5 engineers to deliver a major platform redesign, improving performance by 40% and reducing costs by $200k annually.",
    "Worked on some projects and helped the team with various tasks.",
    "Developed machine learning models achieving 95% accuracy, presented findings at 3 conferences.",
  ];

  const animateScore = (target: number) => {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setDemoScore(target);
        clearInterval(interval);
      } else {
        setDemoScore(current);
      }
    }, 20);
  };

  const handleSampleClick = (text: string) => {
    setDemoText(text);
    const score = text.length > 80 ? 85 + Math.floor(Math.random() * 12) : 35 + Math.floor(Math.random() * 25);
    animateScore(score);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-500/20 text-accent-500 flex items-center justify-center">
          <Target size={20} />
        </div>
        <div>
          <h3 className="text-h4 font-semibold text-black">Live ATS Preview</h3>
          <p className="text-micro text-gray-500">See how your resume performs in real-time</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {sampleResumes.map((text, i) => (
          <button
            key={i}
            onClick={() => handleSampleClick(text)}
            className="text-micro px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-accent-300 hover:text-accent-600 transition-all"
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <textarea
        value={demoText}
        onChange={(e) => setDemoText(e.target.value)}
        placeholder="Paste a bullet point or sentence to see its ATS score..."
        className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-small outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15 resize-none mb-3"
      />

      {demoText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent-500/5 to-transparent rounded-xl border border-accent-500/20"
        >
          <div className="relative">
            <svg width="56" height="56" className="transform -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke={demoScore >= 70 ? "#10b981" : demoScore >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - demoScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-h4 font-bold">
              {demoScore}
            </span>
          </div>
          <div>
            <p className="text-small font-semibold text-black">
              {demoScore >= 80 ? "Excellent — strong ATS performance! 🎯" :
               demoScore >= 60 ? "Good — some room for improvement" :
               "Needs work — try adding metrics and action verbs"}
            </p>
            <p className="text-micro text-gray-500 mt-0.5">
              {demoScore >= 80 ? "Your content uses strong action verbs and measurable outcomes." :
               demoScore >= 60 ? "Consider adding more specific numbers and achievements." :
               "Use the format: Action verb + task + measurable result."}
            </p>
          </div>
        </motion.div>
      )}

      {!demoText && (
        <p className="text-micro text-gray-400 text-center py-3">
          Click an example above or type your own text to see instant ATS scoring
        </p>
      )}
    </div>
  );
}

// ─── Testimonial Carousel ────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Got 3 internship offers after optimizing my resume with Freebuff. The ATS score feature is a game-changer.",
    author: "Priya S.",
    role: "CS Student, Stanford University",
    category: "student" as ResumeCategory,
    rating: 5,
  },
  {
    quote: "As a fresher, I was struggling to fill one page. The AI suggestions helped me turn 3 bullet points into a compelling resume.",
    author: "Rahul K.",
    role: "Frontend Developer (new grad)",
    category: "fresher" as ResumeCategory,
    rating: 5,
  },
  {
    quote: "10 years into my career and I've never had a resume get this much recruiter attention. The senior-level tailoring is incredible.",
    author: "Amanda L.",
    role: "Engineering Manager",
    category: "experienced" as ResumeCategory,
    rating: 5,
  },
  {
    quote: "Compared side-by-side with Jobscan, Teal, and Rezi — Freebuff's suggestions were more actionable and the ATS analysis was more detailed.",
    author: "Michael T.",
    role: "Product Designer",
    category: "experienced" as ResumeCategory,
    rating: 5,
  },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-accent-500/20 transition-all duration-300 group"
    >
      <FaQuoteLeft className="text-accent-200 text-xl mb-3 group-hover:text-accent-300 transition-colors" />
      <p className="text-body text-gray-700 mb-4 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-small font-semibold text-black">{testimonial.author}</p>
          <p className="text-micro text-gray-500">{testimonial.role}</p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Competitor Comparison ───────────────────────────────────
const COMPETITOR_FEATURES = [
  { name: "Category-specific ATS analysis", freebuff: true, teal: false, kickresume: false, rezi: false, enhancv: false, jobscan: true },
  { name: "AI bullet point enhancement", freebuff: true, teal: true, kickresume: true, rezi: true, enhancv: true, jobscan: false },
  { name: "Live ATS preview (free)", freebuff: true, teal: false, kickresume: false, rezi: false, enhancv: false, jobscan: false },
  { name: "Job description matching", freebuff: true, teal: true, kickresume: false, rezi: true, enhancv: false, jobscan: true },
  { name: "GitHub/LinkedIn auto-import", freebuff: true, teal: false, kickresume: false, rezi: false, enhancv: true, jobscan: false },
  { name: "Student/internship optimized", freebuff: true, teal: false, kickresume: false, rezi: false, enhancv: false, jobscan: false },
  { name: "Fresher project focus mode", freebuff: true, teal: false, kickresume: false, rezi: false, enhancv: false, jobscan: false },
  { name: "Senior/executive tailoring", freebuff: true, teal: true, kickresume: false, rezi: false, enhancv: false, jobscan: false },
  { name: "Free tier with real features", freebuff: true, teal: false, kickresume: true, rezi: true, enhancv: true, jobscan: false },
  { name: "Grammar & style checker", freebuff: true, teal: true, kickresume: true, rezi: true, enhancv: true, jobscan: false },
  { name: "Premium PDF export", freebuff: true, teal: true, kickresume: true, rezi: true, enhancv: true, jobscan: false },
  { name: "Kanban job tracker", freebuff: true, teal: true, kickresume: false, rezi: false, enhancv: false, jobscan: false },
  { name: "Cover letter generation", freebuff: true, teal: true, kickresume: true, rezi: true, enhancv: true, jobscan: false },
  { name: "Multiple professional templates", freebuff: true, teal: true, kickresume: true, rezi: true, enhancv: true, jobscan: false },
];

function ComparisonTable() {
  const [highlightColumn] = useState<string | null>("freebuff");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small">
        <thead>
          <tr>
            <th className="text-left py-3 pr-4 text-gray-500 font-medium">Feature</th>
            {(["freebuff", "teal", "kickresume", "rezi", "enhancv", "jobscan"] as const).map((key) => (
              <th
                key={key}
                className={`py-3 px-3 text-center font-semibold transition-colors ${
                  highlightColumn === key ? "bg-accent-500/10" : ""
                } ${key === "freebuff" ? "text-accent-600" : "text-gray-600"}`}
              >
                <span className="text-micro uppercase tracking-wider">
                  {key === "freebuff" ? "Freebuff" :
                   key === "kickresume" ? "Kickresume" :
                   key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPETITOR_FEATURES.map((feature, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="py-3 pr-4 text-gray-700 font-medium">{feature.name}</td>
              {(["freebuff", "teal", "kickresume", "rezi", "enhancv", "jobscan"] as const).map((key) => (
                <td
                  key={key}
                  className={`py-3 px-3 text-center transition-colors ${
                    highlightColumn === key ? "bg-gray-50" : ""
                  } ${key === "freebuff" ? "bg-accent-500/5" : ""}`}
                >
                  {feature[key] ? (
                    <CheckCircle2 size={16} className={key === "freebuff" ? "text-accent-500 mx-auto" : "text-green-500 mx-auto"} />
                  ) : (
                    <span className="text-gray-300">&mdash;</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Statistics Counter ──────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "20K+", label: "Active users" },
    { value: "96%", label: "ATS success rate" },
    { value: "4.9★", label: "User rating" },
    { value: "50K+", label: "Resumes created" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="text-center"
        >
          <p className="text-h1 font-bold text-black">{stat.value}</p>
          <p className="text-small text-gray-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Category Features Grid ──────────────────────────────────
function CategoryFeatures({ category }: { category: ResumeCategory }) {
  const features: Record<ResumeCategory, { icon: React.ReactNode; title: string; desc: string }[]> = {
    student: [
      { icon: <BookOpen size={20} />, title: "GPA & Coursework Optimizer", desc: "Showcase your academic achievements in the best light for ATS systems used by university recruiters." },
      { icon: <Zap size={20} />, title: "Project Spotlight", desc: "Transform class projects into compelling portfolio entries with AI-generated descriptions." },
      { icon: <Users size={20} />, title: "Extracurricular Builder", desc: "Highlight leadership in clubs, societies, and volunteer work to stand out." },
      { icon: <Target size={20} />, title: "Intern-Ready Scoring", desc: "Our ATS is calibrated for how internship programs evaluate student applications." },
    ],
    fresher: [
      { icon: <Zap size={20} />, title: "Experience Gap Filler", desc: "Bridge the gap between education and professional experience with project-focused content." },
      { icon: <Wand2 size={20} />, title: "Entry-Level Keywords", desc: "Automatically surface the keywords fresher roles look for — not just senior-level jargon." },
      { icon: <FaGithub size={20} />, title: "GitHub to Resume", desc: "Import your repos and turn them into polished project entries with one click." },
      { icon: <TrendingUp size={20} />, title: "Skill Highlighting", desc: "Focus on transferable skills from internships, courses, and personal projects." },
    ],
    experienced: [
      { icon: <BarChart3 size={20} />, title: "Impact Quantifier", desc: "Turn vague responsibilities into hard numbers — revenue, team size, cost savings, and more." },
      { icon: <Shield size={20} />, title: "Executive ATS Tuning", desc: "Optimized for senior roles with advanced keyword matching and leadership signal detection." },
      { icon: <Target size={20} />, title: "Role-Specific Tailoring", desc: "Adapt your resume for CTO, VP, Director, or Principal roles with targeted content suggestions." },
      { icon: <Globe size={20} />, title: "Career Narrative Builder", desc: "Craft a compelling career progression story from junior to senior with AI guidance." },
    ],
    internship: [
      { icon: <BookOpen size={20} />, title: "Coursework-to-Skill Mapping", desc: "Connect your academic coursework directly to skills internship programs are searching for." },
      { icon: <Zap size={20} />, title: "Quick Apply Ready", desc: "Generate internship-ready resumes optimized for high-volume application portals." },
      { icon: <Users size={20} />, title: "Peer Comparison Insights", desc: "See how your resume stacks up against other applicants for the same internship type." },
      { icon: <Search size={20} />, title: "Program-Specific Keywords", desc: "Keywords tuned for intern hiring programs at top tech companies, startups, and research labs." },
    ],
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {features[category].map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-accent-500/30 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            {f.icon}
          </div>
          <h4 className="text-h4 font-semibold text-black mb-1">{f.title}</h4>
          <p className="text-small text-gray-500 leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Template Showcase ───────────────────────────────────────
const TEMPLATES = [
  { name: "Modern Minimal", tag: "Best for experienced", bgColor: "bg-white" },
  { name: "ATS Professional", tag: "Best for ATS", bgColor: "bg-gray-50" },
  { name: "Student Portfolio", tag: "Best for students", bgColor: "bg-white" },
  { name: "Creative Tech", tag: "Best for freshers", bgColor: "bg-gray-50" },
  { name: "Executive Suite", tag: "Best for senior roles", bgColor: "bg-white" },
  { name: "Internship Ready", tag: "Best for interns", bgColor: "bg-gray-50" },
];

// ─── Main Page Component ─────────────────────────────────────
export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50]);
  const [activeCategory, setActiveCategory] = useState<ResumeCategory>("experienced");

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-black overflow-hidden selection:bg-accent-500/30">
      {/* Global Noise Texture */}
      <div className="fixed inset-0 z-[9999] pointer-events-none bg-noise opacity-40 mix-blend-overlay" />

      {/* ════════ 1. HERO SECTION ════════ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 min-h-screen flex items-center">
        {/* Background 3D Scene */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Hero3DScene />
        </div>
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-black opacity-15 pointer-events-none mask-image-b" />

        <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-8 items-center relative z-10 w-full">
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-2xl"
          >
            {/* Trust Banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 text-micro font-medium mb-6 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
              #1 Rated AI Resume Builder
              <span className="text-gray-300 mx-1">·</span>
              <span className="text-accent-600 font-semibold">4.9★</span>
              <span className="hidden sm:inline">from 2,500+ reviews</span>
            </motion.div>

            {/* Category Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
            </motion.div>

            {/* Dynamic Hero Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-display tracking-tight mb-4 font-bold leading-tight">
                  {CATEGORY_HERO_CONTENT[activeCategory].title.split(".").map((part, i, arr) => (
                    <span key={i}>
                      {part}{i < arr.length - 1 ? "." : ""}
                      {i === 0 && <br className="hidden lg:block" />}
                    </span>
                  ))}
                </h1>

                <p className="text-body-lg text-gray-500 mb-8 leading-relaxed max-w-xl">
                  {CATEGORY_HERO_CONTENT[activeCategory].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-xl h-14 px-8 text-body font-medium shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.4)] transition-shadow">
                  Create Free Resume
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-xl h-14 px-8 text-body font-medium border border-gray-300 hover:bg-white hover:border-gray-400 flex items-center justify-center gap-2">
                  <LayoutTemplate size={18} />
                  Browse Templates
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-6 text-small text-gray-500">
              <div className="flex items-center -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-300 to-accent-500 border-2 border-white flex items-center justify-center text-white text-micro font-bold">
                    {["P", "R", "A", "M"][i-1]}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-accent-500 border-2 border-white flex items-center justify-center text-white text-micro font-bold">
                  +
                </div>
              </div>
              <span className="font-medium text-black">Trusted by 20,000+</span>
              <div className="hidden sm:flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-amber-400" />)}
                </div>
              </div>
            </div>
          </motion.div>

          <HeroMockup category={activeCategory} />
        </div>
      </section>

      {/* ════════ 2. STATS BANNER ════════ */}
      <section className="py-16 border-t border-gray-200">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <StatsSection />
        </div>
      </section>

      {/* ════════ 3. CATEGORY FEATURES ════════ */}
      <section className="py-24 relative border-t border-gray-200">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 relative z-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-h2 font-bold mb-3">Tailored for every career stage.</h2>
              <p className="text-body-lg text-gray-500">Unlike generic resume builders, Freebuff adapts its ATS scoring, suggestions, and templates to where you are in your career.</p>
            </div>
            <div className="hidden md:block">
              <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CategoryFeatures category={activeCategory} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ════════ 4. LIVE ATS DEMO + TEMPLATES ════════ */}
      <section className="py-24 relative border-t border-gray-200">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Live ATS Demo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <LiveAtsDemo />
            </motion.div>

            {/* Right: Templates */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/20 text-accent-500 flex items-center justify-center">
                    <LayoutTemplate size={20} />
                  </div>
                  <div>
                    <h3 className="text-h4 font-semibold text-black">Premium Templates</h3>
                    <p className="text-micro text-gray-500">ATS-optimized for every career stage</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((t) => (
                    <div key={t.name} className={`${t.bgColor} border border-gray-200 rounded-xl p-4 hover:border-accent-500/30 hover:shadow-sm transition-all duration-300 cursor-pointer group`}>
                      <div className="aspect-[3/4] rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 mb-2 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full p-2 space-y-1.5">
                          {[40, 60, 45, 55].map((w, i) => (
                            <div key={i} className="h-1.5 bg-gray-300 rounded" style={{ width: `${w}%` }} />
                          ))}
                          <div className="h-px bg-gray-200 my-2" />
                          {[50, 70, 55, 65].map((w, i) => (
                            <div key={i} className="h-1 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-small font-semibold text-black group-hover:text-accent-600 transition-colors">{t.name}</p>
                      <p className="text-micro text-gray-400">{t.tag}</p>
                    </div>
                  ))}
                </div>

                <Link href="/templates" className="block mt-4">
                  <Button variant="ghost" className="w-full border border-gray-200 hover:bg-white text-gray-600 hover:text-black">
                    View all templates <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ 5. COMPETITOR COMPARISON ════════ */}
      <section className="py-24 relative border-t border-gray-200">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 relative z-10"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 text-accent-600 text-micro font-semibold mb-4 border border-accent-500/20">
              <Sparkles size={12} /> Why Freebuff wins
            </div>
            <h2 className="text-h2 font-bold mb-3">We checked the competition.</h2>
            <p className="text-body-lg text-gray-500">Side-by-side with Teal, Kickresume, Rezi, Enhancv, and Jobscan — Freebuff delivers more for free.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <ComparisonTable />
          </div>

          <div className="text-center mt-8">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="rounded-xl h-14 px-10 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                Start Free — No Credit Card
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ════════ 6. TESTIMONIALS ════════ */}
      <section className="py-24 relative border-t border-gray-200">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-h2 font-bold mb-3">Loved by job seekers at every level.</h2>
            <p className="text-body-lg text-gray-500">From first-year students to engineering managers — hear from real users.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} index={i} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ════════ 7. FINAL CTA ════════ */}
      <section className="py-32 relative overflow-hidden border-t border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/10 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[1280px] mx-auto px-6 md:px-12 text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 text-accent-600 text-micro font-semibold mb-6 border border-accent-500/20">
            <Sparkles size={14} /> Start building in under 2 minutes
          </div>

          <h2 className="text-display font-bold text-black mb-4 leading-tight">
            Ready to upgrade<br className="hidden lg:block"/> your career?
          </h2>
          <p className="text-body-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Join 20,000+ professionals who&apos;ve built ATS-optimized resumes with Freebuff. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="h-14 px-10 text-body-lg font-medium rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-shadow">
                Build Your Resume Free
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="lg" className="h-14 px-10 text-body-lg font-medium rounded-xl border border-gray-300 hover:bg-white">
                See Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
