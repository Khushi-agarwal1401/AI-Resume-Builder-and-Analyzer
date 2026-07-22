"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { 
  CheckCircle2, 
  Wand2, 
  Star,
  ArrowRight,
  Shield,
  Zap,
  Target,
  BarChart3,
  FileText,
  Briefcase,
  TrendingUp,
  Play
} from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { useRef } from "react";

// --- HERO SHOWCASE COMPONENT ---
function HeroShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

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

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-1200 z-10 pointer-events-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-400/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Main Resume Card */}
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className="relative w-full max-w-[380px] h-[520px] bg-white rounded-[24px] border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transform-style-3d cursor-crosshair ml-auto lg:mr-16"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-black/5 pointer-events-none rounded-[24px]" />
        
        {/* Top bar with logo */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
           <div className="w-6 h-6 rounded bg-accent-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45" />
           </div>
        </div>

        {/* The Paper content container with overflow hidden to clip text but not the sidebar which is absolute to the parent */}
        <div className="p-7 h-[calc(100%-57px)] flex flex-col relative z-10 opacity-90 overflow-hidden rounded-b-[24px]">
           {/* Header */}
           <div className="mb-6">
              <h3 className="text-[24px] font-black text-gray-900 mb-1 leading-none">Rohan Sharma</h3>
              <p className="text-[11px] text-gray-600 font-bold mb-3 tracking-wide">Senior Software Engineer</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-gray-400 font-medium">
                <span className="flex items-center gap-1">@ rohan.sharma@email.com</span>
                <span className="flex items-center gap-1">+91 98765 43210</span>
                <span className="flex items-center gap-1">Bengaluru, India</span>
                <span className="flex items-center gap-1">linkedin.com/in/rohansharma</span>
              </div>
           </div>

           {/* Professional Summary */}
           <div className="mb-5">
              <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Professional Summary</h4>
              <p className="text-[9px] text-gray-600 leading-relaxed font-medium">
                Full-stack engineer with 6+ years of experience building scalable web applications and APIs. Passionate about <span className="text-accent-600 font-bold">clean code, performance</span>, and solving real-world problems.
              </p>
           </div>

           {/* Experience block */}
           <div className="mb-4">
              <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Experience</h4>
              <div className="mb-3">
                 <div className="flex justify-between items-baseline mb-0.5">
                   <h5 className="text-[10px] font-bold text-gray-900">Senior Software Engineer</h5>
                   <span className="text-[8px] text-gray-400 font-medium">Jan 2021 - Present</span>
                 </div>
                 <p className="text-[8px] text-accent-600 font-bold mb-2">TechNova Solutions</p>
                 <ul className="list-disc pl-3 text-[9px] text-gray-600 leading-[1.6] space-y-1 font-medium">
                   <li>Led a team of 5 engineers and shipped 10+ high-impact features</li>
                   <li>Improved API performance by <span className="text-accent-600 font-bold">40%</span> through optimization</li>
                   <li>Built and maintained APIs serving <span className="text-accent-600 font-bold">100K+</span> users daily</li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Floating Sidebar (mockup elements) - Moved further left */}
        <div className="absolute top-24 -left-[90px] flex flex-col gap-2.5 z-20">
           {['Summary', 'Experience', 'Projects', 'Skills', 'Education', 'Certificates'].map((item, i) => (
             <motion.div 
               key={item} 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 + i * 0.1 }}
               className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pr-3 pl-2 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 hover:scale-105 transition-transform"
             >
                <div className={`w-5 h-5 rounded-full ${i === 1 ? 'bg-accent-600 text-white' : 'bg-accent-50 text-accent-600'} flex items-center justify-center`}><CheckCircle2 size={12} strokeWidth={3} /></div>
                <span className={`text-[10px] font-bold ${i === 1 ? 'text-gray-900' : 'text-gray-500'}`}>{item}</span>
             </motion.div>
           ))}
        </div>

        {/* AI Suggestion Popup */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-4 z-30"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-gray-900 flex items-center gap-1.5"><Wand2 size={12} className="text-accent-600" /> AI Suggestion</span>
            <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-gray-200">Close</span>
          </div>
          <p className="text-[9px] text-gray-500 mb-2 font-medium">Add more impact by including metrics.</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {['React', 'TypeScript', 'AWS', 'PostgreSQL'].map((s) => (
               <span key={s} className="text-[8px] px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-medium">{s}</span>
            ))}
            <span className="text-[8px] px-1.5 py-0.5 text-gray-400 font-medium">+12 more</span>
          </div>
          <div className="flex items-center justify-between bg-accent-50 text-accent-700 px-3 py-2 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-accent-100 transition-colors">
             <span>Improved performance by 40%</span>
             <div className="w-4 h-4 rounded-full bg-accent-600 text-white flex items-center justify-center shadow-sm"><ArrowRight size={10} /></div>
          </div>
        </motion.div>

        {/* Floating Widget: ATS Score Panel (Moved INSIDE motion.div and pushed right) */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 -right-[80px] lg:-right-[140px] w-64 bg-white/95 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] z-40 transform translate-z-10"
        >
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">ATS Score</p>
          
          {/* Circular Chart */}
          <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <motion.circle
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - 0.92) }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                cx="56" cy="56" r="48" fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 48}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="text-h1 font-black text-gray-900 leading-none">92</span>
              <span className="text-[10px] font-black text-green-500 uppercase tracking-wider mt-0.5">Excellent</span>
            </div>
          </div>

          {/* Stats Bars */}
          <div className="space-y-4">
            {[
              { label: 'Skills Match', val: 94 },
              { label: 'Keyword Match', val: 90 },
              { label: 'Content Quality', val: 99 },
              { label: 'Formatting', val: 86 }
            ].map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1.5">
                  <span>{stat.label}</span>
                  <span>{stat.val}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${stat.val}%` }} 
                    transition={{ delay: 1, duration: 1 }}
                    className="h-full bg-green-500 rounded-full" 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
             <span className="text-[11px] font-black text-gray-700">Interview Chance</span>
             <div className="flex items-center gap-1 text-green-500 font-black text-small">
               <TrendingUp size={16} strokeWidth={3} /> 76%
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}


// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 50]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-900 overflow-hidden font-sans">
      
      {/* ════════ 1. HERO SECTION ════════ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 min-h-screen flex flex-col justify-center z-10">
        
        {/* Subtle background noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />

        <div className="max-w-[1320px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-2xl z-20"
          >
            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 text-micro font-bold mb-6 shadow-sm uppercase tracking-widest"
            >
              <div className="w-2 h-2 rounded-full bg-accent-500" />
              AI CAREER COPILOT
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-[56px] md:text-[64px] lg:text-[76px] tracking-tight mb-6 font-extrabold leading-[1.05] text-gray-900">
                Your career. <br/>
                <span className="text-accent-600">Optimized by AI.</span>
              </h1>

              <p className="text-[18px] lg:text-[20px] text-gray-500 mb-10 leading-relaxed max-w-lg font-medium">
                Create ATS-optimized resumes, match jobs perfectly, and land more interviews with AI that understands you and the job market.
              </p>
            </motion.div>

            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-8 text-body-lg font-bold bg-accent-600 hover:bg-accent-700 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] flex items-center justify-center whitespace-nowrap">
                  Create My Resume
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              
              <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-6 text-body font-bold bg-white border border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FaLinkedinIn size={14} />
                </div>
                <div className="text-left">
                  <div className="leading-tight">Import LinkedIn</div>
                  <div className="text-[10px] text-gray-400 font-normal">One click</div>
                </div>
              </Button>
              
              <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-6 text-body font-bold bg-white border border-gray-200 hover:bg-gray-50 shadow-sm flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800">
                  <FaGithub size={14} />
                </div>
                <div className="text-left">
                  <div className="leading-tight">Import GitHub</div>
                  <div className="text-[10px] text-gray-400 font-normal">Auto sync</div>
                </div>
              </Button>
            </motion.div>

            {/* Feature Checkmarks */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="grid grid-cols-2 gap-4 text-small text-gray-500 font-medium max-w-lg"
            >
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-green-500" />
                 No credit card required
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-green-500" />
                 ATS-optimized resumes
               </div>
               <div className="flex items-center gap-2">
                 <Shield size={16} className="text-accent-500" />
                 Privacy first
               </div>
               <div className="flex items-center gap-2">
                 <div className="flex -space-x-2">
                   <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center"><Target size={10} className="text-accent-600"/></div>
                 </div>
                 Loved by job seekers
               </div>
            </motion.div>
          </motion.div>

          <HeroShowcase />
        </div>
      </section>

      {/* ════════ 2. FEATURES & ALL-IN-ONE OS ════════ */}
      <section className="py-20 relative z-10 bg-white border-y border-gray-100">
        <div className="max-w-[1320px] mx-auto px-6 md:px-12 text-center">
          
          <div className="mb-16">
            <h4 className="text-micro font-bold text-accent-600 uppercase tracking-widest mb-3">ALL-IN-ONE CAREER OS</h4>
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-gray-900">
              Everything you need. In one intelligent platform.
            </h2>
          </div>

          {/* Features Row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-24">
             {[
               { icon: <FileText size={24} />, title: 'AI Resume Builder', desc: 'Beautiful resumes\ntailored to you', color: 'from-blue-500 to-cyan-400' },
               { icon: <Shield size={24} />, title: 'ATS Optimization', desc: 'Beat ATS filters\nwith real-time score', color: 'from-green-500 to-emerald-400' },
               { icon: <Target size={24} />, title: 'Job Match', desc: 'Match your resume\nwith the right jobs', color: 'from-accent-600 to-purple-500' },
               { icon: <FaGithub size={24} />, title: 'GitHub Integration', desc: 'Import projects &\ncontributions', color: 'from-gray-700 to-gray-900' },
               { icon: <Briefcase size={24} />, title: 'Cover Letters', desc: 'Generate personalized\ncover letters', color: 'from-blue-400 to-accent-500' },
               { icon: <Briefcase size={24} />, title: 'Job Tracker', desc: 'Track applications\nand follow-ups', color: 'from-rose-400 to-pink-500' },
               { icon: <BarChart3 size={24} />, title: 'Career Analytics', desc: 'Insights to improve\nand grow faster', color: 'from-purple-500 to-indigo-500' },
             ].map((f, i) => (
               <div key={i} className="flex flex-col items-center text-center max-w-[120px]">
                 <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                   {f.icon}
                 </div>
                 <h5 className="text-small font-bold text-gray-900 mb-2 leading-tight">{f.title}</h5>
                 <p className="text-[11px] text-gray-500 whitespace-pre-line leading-tight">{f.desc}</p>
               </div>
             ))}
          </div>

          {/* Dark Showcase Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 text-left">
            <div className="w-full lg:w-1/3">
              <h4 className="text-[10px] font-bold text-accent-600 uppercase tracking-widest mb-3">SEE AI IN ACTION</h4>
              <h2 className="text-[40px] md:text-[48px] font-extrabold text-gray-900 mb-8 leading-tight">
                From resume to interview in <span className="text-accent-600">minutes</span>.
              </h2>
              
              <ul className="space-y-4 mb-8">
                {[
                  "AI writes and improves your content",
                  "Matches your resume with job descriptions",
                  "Optimizes keywords and suggestions",
                  "Boosts your ATS score in real-time"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center mt-0.5 shrink-0">
                      <CheckCircle2 size={12} className="text-accent-600" />
                    </div>
                    <span className="text-body font-medium text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant="outline" className="rounded-full font-bold bg-white text-gray-800 border-gray-200 hover:bg-gray-50 h-12 px-6 shadow-sm flex items-center gap-2">
                See How It Works <div className="w-5 h-5 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center ml-1"><Play size={10} fill="currentColor" /></div>
              </Button>
            </div>

            {/* Dark UI Mockup */}
            <div className="w-full lg:w-2/3 bg-[#0a0f1c] rounded-3xl p-6 lg:p-10 border border-gray-800 shadow-2xl relative overflow-hidden">
               {/* Background glows */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-accent-500 to-transparent shadow-[0_0_20px_10px_rgba(37,99,235,0.3)]" />
               <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full h-[100px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-600/30 via-transparent to-transparent opacity-50 blur-xl pointer-events-none" />

               {/* Header steps */}
               <div className="flex items-center justify-center gap-8 mb-8 text-[11px] font-bold text-gray-500 border-b border-gray-800 pb-6">
                 <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">1</div> Add Details</div>
                 <div className="w-8 h-px bg-gray-800" />
                 <div className="flex items-center gap-2 text-white"><div className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center"><Wand2 size={12}/></div> AI Optimizes</div>
                 <div className="w-8 h-px bg-gray-800" />
                 <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">3</div> Match Job</div>
                 <div className="w-8 h-px bg-gray-800" />
                 <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">4</div> Get Hired</div>
               </div>

               <div className="grid grid-cols-12 gap-6">
                 {/* Left Input Sidebar */}
                 <div className="col-span-3 space-y-3">
                   <p className="text-[11px] text-gray-400 font-bold mb-4">Your Input</p>
                   <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300">Software Engineer</div>
                   <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300">5+ Years Experience</div>
                   <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300">React, Node.js, AWS</div>
                   <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300">Remote Preferred</div>
                 </div>

                 {/* Center AI Box */}
                 <div className="col-span-6 bg-[#111827]/80 rounded-2xl border border-gray-800 p-6 relative">
                   <div className="text-[12px] font-bold text-white mb-6 flex items-center gap-2">
                     <Wand2 size={14} className="text-accent-500" /> AI is optimizing your resume...
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex items-center gap-4">
                       <div className="w-1/3 bg-gray-800/50 p-3 rounded-lg text-[10px] text-gray-400">Built API</div>
                       <ArrowRight size={14} className="text-gray-600" />
                       <div className="w-2/3 bg-accent-500/10 border border-accent-500/30 p-3 rounded-lg text-[10px] text-accent-100 font-medium">Developed RESTful API serving 50K+ users</div>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="w-1/3 bg-gray-800/50 p-3 rounded-lg text-[10px] text-gray-400">Responsible for database</div>
                       <ArrowRight size={14} className="text-gray-600" />
                       <div className="w-2/3 bg-accent-500/10 border border-accent-500/30 p-3 rounded-lg text-[10px] text-accent-100 font-medium">Designed and optimized PostgreSQL database improving performance by 35%.</div>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="w-1/3 bg-gray-800/50 p-3 rounded-lg text-[10px] text-gray-400">Worked on frontend</div>
                       <ArrowRight size={14} className="text-gray-600" />
                       <div className="w-2/3 bg-green-500/10 border border-green-500/30 p-3 rounded-lg text-[10px] text-green-100 font-medium">Developed responsive React applications with 99% uptime</div>
                     </div>
                   </div>

                   <div className="mt-8 pt-4 border-t border-gray-800 flex justify-between items-end">
                     <div className="text-[11px] text-gray-400 font-bold">ATS Score Improving...</div>
                     <div className="flex items-baseline gap-2">
                       <span className="text-h3 font-bold text-gray-500 line-through">82%</span>
                       <ArrowRight size={14} className="text-gray-500" />
                       <span className="text-h1 font-black text-white">92%</span>
                       <span className="text-[10px] text-green-400 uppercase font-bold mb-1">Excellent</span>
                     </div>
                   </div>
                 </div>

                 {/* Right Match Box */}
                 <div className="col-span-3 border-l border-gray-800 pl-6">
                    <p className="text-[11px] text-gray-400 font-bold mb-6">Job Match</p>
                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-gray-800 flex flex-col items-center justify-center mb-6 relative">
                       <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                         <circle cx="36" cy="36" r="34" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="213" strokeDashoffset="21" strokeLinecap="round" />
                       </svg>
                       <span className="text-[18px] font-black text-white leading-none">96%</span>
                       <span className="text-[8px] text-green-400 font-bold">Great Match</span>
                    </div>

                    <p className="text-[10px] font-bold text-white mb-3">Top Matching Skills</p>
                    <ul className="space-y-2">
                      {['React', 'Node.js', 'AWS', 'TypeScript', 'PostgreSQL'].map(s => (
                        <li key={s} className="flex items-center gap-2 text-[10px] text-gray-300">
                          <CheckCircle2 size={10} className="text-green-500" /> {s}
                        </li>
                      ))}
                      <li className="text-[9px] text-gray-500 italic ml-4">+4 more</li>
                    </ul>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 3. TAILORED SECTION ════════ */}
      <section className="py-24 relative z-10 bg-[#FAFAFA]">
        <div className="max-w-[1320px] mx-auto px-6 md:px-12">
          
          <div className="flex flex-col lg:flex-row items-center gap-16">
             <div className="w-full lg:w-1/3">
               <h4 className="text-[10px] font-bold text-accent-600 uppercase tracking-widest mb-3">TAILORED FOR EVERY COMPANY</h4>
               <h2 className="text-[40px] md:text-[48px] font-extrabold text-gray-900 mb-6 leading-[1.1]">
                 One resume. <br/> Every opportunity.
               </h2>
               <p className="text-[18px] text-gray-500 font-medium mb-8">
                 Get AI-tailored resumes for startups, MNCs, or product companies in one click.
               </p>
               <Button variant="outline" className="rounded-full font-bold bg-white text-gray-800 border-gray-200 hover:bg-gray-50 h-12 px-6 shadow-sm">
                 Try Company Tailoring <ArrowRight size={16} className="ml-2" />
               </Button>
             </div>

             <div className="w-full lg:w-2/3 flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
                {/* Google Card */}
                <div className="min-w-[240px] bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] shrink-0 snap-center">
                  <div className="w-10 h-10 mb-6 bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-800">
                    G
                  </div>
                  <h4 className="text-body font-bold text-gray-900 mb-4">Google</h4>
                  <div className="space-y-2 mb-8">
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Impact <span>+</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Scalability <span>+</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Leadership <span>+</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <span className="text-[11px] font-bold text-gray-500">ATS Score</span>
                     <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-gray-900">94%</div>
                  </div>
                </div>

                {/* Microsoft Card */}
                <div className="min-w-[240px] bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] shrink-0 snap-center">
                  <div className="w-10 h-10 mb-6 bg-gray-50 rounded-lg flex flex-wrap p-2 gap-0.5 justify-center content-center">
                    <div className="w-2.5 h-2.5 bg-[#f25022]"></div><div className="w-2.5 h-2.5 bg-[#7fba00]"></div>
                    <div className="w-2.5 h-2.5 bg-[#00a4ef]"></div><div className="w-2.5 h-2.5 bg-[#ffb900]"></div>
                  </div>
                  <h4 className="text-body font-bold text-gray-900 mb-4">Microsoft</h4>
                  <div className="space-y-2 mb-8">
                    <div className="bg-accent-50 text-accent-700 rounded px-3 py-1.5 text-[11px] font-semibold flex justify-between border border-accent-100">Collaboration <span>+</span></div>
                    <div className="bg-accent-50 text-accent-700 rounded px-3 py-1.5 text-[11px] font-semibold flex justify-between border border-accent-100">Communication <span>+</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Process <span>+</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <span className="text-[11px] font-bold text-gray-500">ATS Score</span>
                     <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-gray-900">91%</div>
                  </div>
                </div>

                {/* Amazon Card */}
                <div className="min-w-[240px] bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] shrink-0 snap-center opacity-70">
                  <div className="w-10 h-10 mb-6 flex items-center text-lg font-black tracking-tighter">
                    amazon
                  </div>
                  <h4 className="text-body font-bold text-gray-900 mb-4">Amazon</h4>
                  <div className="space-y-2 mb-8">
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Ownership <span>-</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Results <span>-</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Bias for Action <span>-</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <span className="text-[11px] font-bold text-gray-500">ATS Score</span>
                     <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-500">9%</div>
                  </div>
                </div>

                {/* Startups Card */}
                <div className="min-w-[240px] bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] shrink-0 snap-center">
                  <div className="w-10 h-10 mb-6 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                    🚀
                  </div>
                  <h4 className="text-body font-bold text-gray-900 mb-4">Startups</h4>
                  <div className="space-y-2 mb-8">
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Multi-tasking <span>+</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Ownership <span>+</span></div>
                    <div className="bg-gray-50 rounded px-3 py-1.5 text-[11px] font-medium text-gray-600 flex justify-between">Fast Growth <span>+</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <span className="text-[11px] font-bold text-gray-500">ATS Score</span>
                     <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-gray-900">93%</div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* ════════ 4. BOTTOM CTA ════════ */}
      <section className="py-24 relative overflow-hidden z-10 bg-white border-t border-gray-100">
        <div className="max-w-[1320px] mx-auto px-6 md:px-12 text-center relative z-20">
          <h2 className="text-[40px] md:text-[56px] font-extrabold text-gray-900 mb-6 leading-tight">
            Your dream job is <span className="text-accent-600">closer</span> <br className="hidden md:block" /> than you think.
          </h2>
          <p className="text-[18px] text-gray-500 mb-12 max-w-2xl mx-auto font-medium">
            Join thousands of job seekers who are building better resumes and better careers with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/sign-up">
              <Button variant="accent" size="lg" className="h-14 px-10 text-[16px] font-bold rounded-full bg-accent-600 hover:bg-accent-700 shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]">
                Start for Free
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <p className="text-small text-gray-500 font-bold">No credit card required</p>
          </div>
        </div>

        {/* Decorative graphic at bottom right */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-40 md:opacity-100">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-accent-100 rounded-3xl -rotate-12 scale-90" />
            <div className="absolute inset-0 bg-white rounded-3xl border border-gray-100 shadow-2xl p-4 flex flex-col gap-2 rotate-6">
              <div className="w-3/4 h-3 bg-gray-200 rounded-full mb-2" />
              <div className="w-full h-2 bg-gray-100 rounded-full" />
              <div className="w-5/6 h-2 bg-gray-100 rounded-full" />
              <div className="w-full h-2 bg-gray-100 rounded-full" />
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-accent-600/30">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
