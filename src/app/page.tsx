"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Wand2, 
  Sparkles,
  RefreshCw,
  Download,
  MoreVertical,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  FolderDot,
  Languages,
  Check,
  TrendingUp,
  Clock,
  ShieldCheck,
  Target
} from "lucide-react";
import { FaGithub, FaLinkedin, FaGoogle, FaAmazon, FaMicrosoft } from "react-icons/fa";

function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen pt-24 bg-white overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        
        {/* Background decorative elements */}
        <div className="absolute top-10 right-20 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="flex flex-col max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 bg-blue-50 text-accent-600 px-3 py-1.5 rounded-full w-fit mb-6 shadow-sm border border-blue-100"
            >
              <Sparkles size={14} className="fill-accent-600" />
              <span className="text-[11px] font-black tracking-widest uppercase">AI Career Copilot</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-h1 sm:text-[64px] font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6"
            >
              Your career.<br />
              <span className="text-accent-600">Engineered by AI.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-body-lg text-gray-600 mb-8 max-w-lg leading-relaxed"
            >
              One intelligent workspace to build, optimize, and keep your resume interview-ready—automatically.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-6 mb-10 text-small font-bold text-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center"><Sparkles size={10} className="fill-accent-600" /></div>
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check size={12} strokeWidth={3} /></div>
                <span>ATS-Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><RefreshCw size={10} strokeWidth={3} /></div>
                <span>Auto Updated</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-xl h-14 px-6 text-small font-bold bg-accent-600 hover:bg-accent-700 shadow-lg flex items-center justify-center whitespace-nowrap">
                  Create My Resume
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl h-14 px-5 text-small font-bold bg-white hover:bg-gray-50 border-gray-200 shadow-sm flex items-center justify-center gap-2">
                <FaLinkedin size={20} className="text-[#0A66C2]" fill="currentColor" />
                <span>Import from LinkedIn</span>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl h-14 px-5 text-small font-bold bg-white hover:bg-gray-50 border-gray-200 shadow-sm flex items-center justify-center gap-2">
                <FaGithub size={20} className="text-gray-900" fill="currentColor" />
                <span>Import from GitHub</span>
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center gap-2 text-[12px] font-bold text-gray-500"
            >
              <ShieldCheck size={16} className="text-green-500" />
              <span>No credit card required</span>
            </motion.div>
          </div>

          {/* Right Hero UI Mockup */}
          <div className="relative w-full h-[600px] flex items-center justify-center z-10">
            {/* The dotted dashed curve line connecting from text to UI */}
            <svg className="absolute -left-[100px] top-10 w-[200px] h-[300px] pointer-events-none hidden lg:block" viewBox="0 0 200 300" fill="none" stroke="currentColor">
              <motion.path 
                d="M 0,20 C 100,20 150,150 180,280" 
                className="stroke-accent-200" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
                strokeLinecap="round" 
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <circle cx="180" cy="280" r="4" className="fill-accent-400 stroke-none" />
            </svg>

            <motion.div 
              initial={{ opacity: 0, x: 20, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              style={{ perspective: 1200 }}
              className="w-full max-w-[640px] ml-auto relative"
            >
              <TiltCard>
                <motion.div 
                  className="w-full h-[520px] bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden"
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
              {/* UI Header */}
              <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded bg-accent-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-[2px] rotate-45" />
                   </div>
                   <span className="text-[12px] font-bold text-gray-800">Resume Builder</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-full text-[10px] font-semibold">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> All changes saved
                 </div>
                 <div className="flex items-center gap-3 text-gray-400">
                    <Download size={14} className="hover:text-gray-700 cursor-pointer" />
                    <MoreVertical size={14} className="hover:text-gray-700 cursor-pointer" />
                 </div>
              </div>

              {/* UI Body */}
              <div className="flex flex-1 overflow-hidden">
                 {/* Sidebar Menu */}
                 <div className="w-32 border-r border-gray-100 bg-gray-50/50 flex flex-col py-3 px-2 gap-0.5 shrink-0">
                    {[
                      { i: User, l: 'Personal', a: false },
                      { i: FileText, l: 'Summary', a: true },
                      { i: Briefcase, l: 'Experience', a: false },
                      { i: GraduationCap, l: 'Education', a: false },
                      { i: Target, l: 'Skills', a: false },
                      { i: FolderDot, l: 'Projects', a: false },
                      { i: Award, l: 'Certificates', a: false },
                      { i: Award, l: 'Achievements', a: false },
                      { i: Languages, l: 'Languages', a: false },
                    ].map(n => (
                      <div key={n.l} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-semibold cursor-pointer ${n.a ? 'bg-white text-accent-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}>
                         <n.i size={12} className={n.a ? "text-accent-600" : "text-gray-400"} /> {n.l}
                      </div>
                    ))}
                 </div>

                 {/* Editor Center */}
                 <div className="flex-1 p-6 overflow-y-auto bg-white relative">
                    {/* Floating sparkling element */}
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute right-4 bottom-10 w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 shadow-xl shadow-accent-500/30 flex items-center justify-center opacity-80"
                    >
                       <Sparkles size={20} className="text-white" />
                    </motion.div>

                    <h2 className="text-[14px] font-bold text-gray-900 mb-4">Summary</h2>
                    <div className="flex items-center gap-2 text-[10px] text-accent-600 font-bold mb-3">
                       <Sparkles size={12} className="fill-accent-600" /> AI is improving your summary... <span className="animate-pulse">|</span>
                    </div>
                    <div className="text-[11px] text-gray-600 leading-relaxed mb-4 border border-accent-100 bg-accent-50/30 p-3 rounded-lg shadow-inner">
                      Results-driven Software Engineer with 4+ years of experience building <span className="text-gray-900 font-bold bg-green-100 px-1 rounded">scalable web applications</span> and APIs. Passionate about <span className="text-gray-900 font-bold bg-green-100 px-1 rounded">clean code, performance,</span> and delivering <span className="text-accent-600 font-bold bg-accent-100 px-1 rounded">real impact.</span>
                    </div>
                    <button className="bg-accent-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-accent-700 transition-colors mb-8">
                      Apply Suggestion
                    </button>

                    <h2 className="text-[14px] font-bold text-gray-900 mb-4">Experience</h2>
                    <div className="mb-4">
                       <div className="flex items-center gap-2 mb-1">
                         <h3 className="text-[11px] font-bold text-gray-900">Senior Software Engineer</h3>
                         <span className="text-[10px] text-gray-400">• 2.3 yrs</span>
                       </div>
                       <p className="text-[10px] text-accent-600 font-semibold mb-2">TechNova Solutions</p>
                       <ul className="list-disc pl-3 text-[10px] text-gray-500 space-y-1">
                         <li>Built and maintained REST APIs serving <span className="text-accent-600 font-bold">100K+</span> users</li>
                         <li>Improved system performance by <span className="text-accent-600 font-bold">40%</span></li>
                         <li>Led a team of 4 engineers</li>
                       </ul>
                    </div>
                 </div>

                 {/* ATS Score Right Pane */}
                 <div className="w-[180px] border-l border-gray-100 bg-gray-50/30 p-4 shrink-0 flex flex-col items-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">ATS Score</p>
                    <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                        <motion.circle
                          initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - 0.92) }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                          cx="40" cy="40" r="34" fill="none"
                          stroke="#10b981" strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 34} strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center flex flex-col items-center justify-center">
                        <span className="text-[20px] font-black text-gray-900 leading-none">92</span>
                        <span className="text-[7px] font-black text-green-500 uppercase tracking-wider mt-0.5">Excellent</span>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      {[
                        { l: 'KEYWORD MATCH', v: 94 },
                        { l: 'SKILLS MATCH', v: 90 },
                        { l: 'CONTENT QUALITY', v: 93 },
                        { l: 'FORMAT', v: 88 }
                      ].map(s => (
                        <div key={s.l}>
                          <div className="flex justify-between text-[7px] font-bold text-gray-700 mb-1">
                            <span>{s.l}</span>
                            <span>{s.v}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 w-full">
                       <p className="text-[7px] font-black text-gray-500 uppercase mb-1">INTERVIEW CHANCE</p>
                       <div className="flex items-center gap-1 text-green-500 font-bold text-[14px]">
                         <TrendingUp size={12} strokeWidth={3} /> 76%
                       </div>
                    </div>
                 </div>
              </div>
                </motion.div>
              </TiltCard>
            </motion.div>
            
            {/* Connected Accounts Pill */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-100 px-6 py-2 flex items-center gap-6 z-20 whitespace-nowrap"
            >
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700">
                  <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><FaLinkedin size={10} fill="currentColor" /></div>
                  LinkedIn <span className="text-green-500 font-semibold ml-1">Connected</span>
               </div>
               <div className="w-px h-3 bg-gray-200" />
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700">
                  <div className="w-4 h-4 bg-gray-100 text-gray-900 rounded flex items-center justify-center"><FaGithub size={10} fill="currentColor" /></div>
                  GitHub <span className="text-gray-500 font-semibold ml-1">Synced</span>
               </div>
               <div className="w-px h-3 bg-gray-200" />
               <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                  <Clock size={12} /> Last updated 2h ago
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. STAGES OF JOURNEY SECTION */}
      <section className="w-full bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="mb-12 text-center">
            <span className="text-[10px] font-black tracking-widest text-accent-600 uppercase mb-4 block">Built for every stage of your journey</span>
          </div>

          <div className="relative w-full">
             {/* Dotted background line connecting cards */}
             <div className="absolute top-[20%] left-[10%] right-[10%] h-px border-t-2 border-dashed border-gray-200 hidden lg:block -z-0" />

             <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15 }
                  }
                }}
             >
                
                {/* Student */}
                <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }}>
                <TiltCard className="h-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <GraduationCap size={20} />
                     </div>
                     <div>
                       <h3 className="text-small font-bold text-gray-900 mb-1">Student</h3>
                       <p className="text-[12px] text-gray-500 leading-tight">Showcase your academic achievements and projects.</p>
                     </div>
                  </div>
                  <div className="mt-auto relative rounded-xl overflow-hidden bg-gray-50 h-[220px] border border-gray-100 group">
                     {/* Mini Resume Template by Code */}
                     <div className="absolute top-4 left-4 w-36 bg-white shadow-md border border-gray-200 rounded p-3 flex flex-col gap-1 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[-2deg] z-0">
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <div className="text-[7px] font-black text-gray-900 leading-none mb-0.5">Alex Johnson</div>
                              <div className="text-[5px] text-gray-500 leading-none">Computer Science Student</div>
                           </div>
                           <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-[8px]">🎓</div>
                        </div>
                        <div className="text-[5px] font-bold text-green-600 mt-1 uppercase">Education</div>
                        <div className="w-full h-[1px] bg-green-100 mb-0.5" />
                        <div className="text-[5px] text-gray-800 font-bold">Stanford University</div>
                        <div className="text-[4px] text-gray-500 mb-1">BS Computer Science • 2021 - 2025</div>
                        
                        <div className="text-[5px] font-bold text-green-600 mt-1 uppercase">Projects</div>
                        <div className="w-full h-[1px] bg-green-100 mb-0.5" />
                        <div className="text-[5px] text-gray-800 font-bold">AI Resume Analyzer</div>
                        <div className="text-[4px] text-gray-500 leading-tight">Built a full-stack application using Next.js to provide ATS scoring.</div>
                     </div>
                     {/* The 3D Person Icon */}
                     <motion.div 
                        className="absolute bottom-0 right-0 w-32 h-44 flex items-end justify-end z-10"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                     >
                        <Image src="/images/student.png" alt="Student" width={130} height={170} className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 origin-bottom" />
                     </motion.div>
                     <div className="absolute bottom-3 left-3 z-20">
                        <span className="text-[9px] font-bold text-green-600 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow border border-green-100">Student Template</span>
                     </div>
                  </div>
                </div>
                </TiltCard>
                </motion.div>

                {/* Internship */}
                <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }}>
                <TiltCard className="h-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Briefcase size={20} />
                     </div>
                     <div>
                       <h3 className="text-small font-bold text-gray-900 mb-1">Internship</h3>
                       <p className="text-[12px] text-gray-500 leading-tight">Highlight your internship experience and skills.</p>
                     </div>
                  </div>
                  <div className="mt-auto relative rounded-xl overflow-hidden bg-gray-50 h-[220px] border border-gray-100 group">
                     {/* Mini Resume Template by Code */}
                     <div className="absolute top-4 left-4 w-36 bg-white shadow-md border border-gray-200 rounded p-3 flex flex-col gap-1 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[-2deg] z-0">
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <div className="text-[7px] font-black text-gray-900 leading-none mb-0.5">Sarah Chen</div>
                              <div className="text-[5px] text-gray-500 leading-none">Software Engineering Intern</div>
                           </div>
                           <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[8px]">💼</div>
                        </div>
                        <div className="text-[5px] font-bold text-blue-600 mt-1 uppercase">Experience</div>
                        <div className="w-full h-[1px] bg-blue-100 mb-0.5" />
                        <div className="text-[5px] text-gray-800 font-bold">Google • SWE Intern</div>
                        <div className="text-[4px] text-gray-500 mb-1 leading-tight">Optimized search algorithms improving query response time by 15%.</div>
                        
                        <div className="text-[5px] font-bold text-blue-600 mt-1 uppercase">Skills</div>
                        <div className="w-full h-[1px] bg-blue-100 mb-0.5" />
                        <div className="flex gap-1 flex-wrap mt-0.5">
                           <span className="text-[4px] bg-gray-100 px-1 rounded">Python</span>
                           <span className="text-[4px] bg-gray-100 px-1 rounded">C++</span>
                           <span className="text-[4px] bg-gray-100 px-1 rounded">React</span>
                        </div>
                     </div>
                     {/* The 3D Person Icon */}
                     <div className="absolute bottom-0 right-0 w-32 h-44 flex items-end justify-end z-10">
                        <Image src="/images/internship.png" alt="Internship" width={130} height={170} className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 origin-bottom" />
                     </div>
                     <div className="absolute bottom-3 left-3 z-20">
                        <span className="text-[9px] font-bold text-blue-600 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow border border-blue-100">Internship Template</span>
                     </div>
                  </div>
                </div>
                </TiltCard>
                </motion.div>

                {/* Fresher */}
                <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }}>
                <TiltCard className="h-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                     </div>
                     <div>
                       <h3 className="text-small font-bold text-gray-900 mb-1">Fresher</h3>
                       <p className="text-[12px] text-gray-500 leading-tight">Stand out in your first job applications.</p>
                     </div>
                  </div>
                  <div className="mt-auto relative rounded-xl overflow-hidden bg-gray-50 h-[220px] border border-gray-100 group">
                     {/* Mini Resume Template by Code */}
                     <div className="absolute top-4 left-4 w-36 bg-white shadow-md border border-gray-200 rounded p-3 flex flex-col gap-1 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[-2deg] z-0">
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <div className="text-[7px] font-black text-gray-900 leading-none mb-0.5">David Kim</div>
                              <div className="text-[5px] text-gray-500 leading-none">Junior Frontend Developer</div>
                           </div>
                           <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-[8px]">✨</div>
                        </div>
                        <div className="text-[5px] font-bold text-purple-600 mt-1 uppercase">Summary</div>
                        <div className="w-full h-[1px] bg-purple-100 mb-0.5" />
                        <div className="text-[4px] text-gray-500 mb-1 leading-tight">Passionate developer with strong foundation in React and modern web technologies.</div>
                        
                        <div className="text-[5px] font-bold text-purple-600 mt-1 uppercase">Experience</div>
                        <div className="w-full h-[1px] bg-purple-100 mb-0.5" />
                        <div className="text-[5px] text-gray-800 font-bold">TechStart • Junior Dev</div>
                        <div className="text-[4px] text-gray-500 leading-tight">Implemented responsive UI components and reduced load times.</div>
                     </div>
                     {/* The 3D Person Icon */}
                     <motion.div 
                        className="absolute bottom-0 right-0 w-32 h-44 flex items-end justify-end z-10"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                     >
                        <Image src="/images/fresher.png" alt="Fresher" width={130} height={170} className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 origin-bottom" />
                     </motion.div>
                     <div className="absolute bottom-3 left-3 z-20">
                        <span className="text-[9px] font-bold text-purple-600 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow border border-purple-100">Fresher Template</span>
                     </div>
                  </div>
                </div>
                </TiltCard>
                </motion.div>

                {/* Experienced */}
                <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } } }}>
                <TiltCard className="h-full">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                     <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={20} />
                     </div>
                     <div>
                       <h3 className="text-small font-bold text-gray-900 mb-1">Experienced</h3>
                       <p className="text-[12px] text-gray-500 leading-tight">Present your impact with measurable results.</p>
                     </div>
                  </div>
                  <div className="mt-auto relative rounded-xl overflow-hidden bg-gray-50 h-[220px] border border-gray-100 group">
                     {/* Mini Resume Template by Code */}
                     <div className="absolute top-4 left-4 w-36 bg-white shadow-md border border-gray-200 rounded p-3 flex flex-col gap-1 transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[-2deg] z-0">
                        <div className="flex justify-between items-start mb-1">
                           <div>
                              <div className="text-[7px] font-black text-gray-900 leading-none mb-0.5">Emily Davis</div>
                              <div className="text-[5px] text-gray-500 leading-none">Senior Product Manager</div>
                           </div>
                           <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-[8px]">📈</div>
                        </div>
                        <div className="text-[5px] font-bold text-red-600 mt-1 uppercase">Experience</div>
                        <div className="w-full h-[1px] bg-red-100 mb-0.5" />
                        <div className="text-[5px] text-gray-800 font-bold">Amazon • Sr. PM</div>
                        <div className="text-[4px] text-gray-500 mb-1 leading-tight">Led cross-functional team of 15 to launch Prime features, generating $2M ARR.</div>
                        
                        <div className="text-[5px] text-gray-800 font-bold">Microsoft • PM II</div>
                        <div className="text-[4px] text-gray-500 leading-tight">Spearheaded Azure dashboard redesign, increasing user engagement by 40%.</div>
                     </div>
                     {/* The 3D Person Icon */}
                     <motion.div 
                        className="absolute bottom-0 right-0 w-32 h-44 flex items-end justify-end z-10"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                     >
                        <Image src="/images/exprienced.png" alt="Experienced" width={130} height={170} className="object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500 origin-bottom" />
                     </motion.div>
                     <div className="absolute bottom-3 left-3 z-20">
                        <span className="text-[9px] font-bold text-red-600 bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow border border-red-100">Professional Template</span>
                     </div>
                  </div>
                </div>
                </TiltCard>
                </motion.div>

             </motion.div>
          </div>
        </div>
      </section>

      {/* 3. ALWAYS UP-TO-DATE SECTION */}
      <section className="w-full bg-white py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
           <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-accent-600 uppercase mb-4 block">Always Up-To-Date</span>
              <h2 className="text-h2 font-extrabold text-gray-900 mb-6 leading-[1.1]">Your resume evolves as you grow.</h2>
              <p className="text-body text-gray-600 mb-8 max-w-md">
                We monitor your LinkedIn and GitHub for new achievements, projects, and certifications. Your resume stays fresh, always.
              </p>
              <Link href="#" className="text-accent-600 font-bold text-[14px] flex items-center gap-2 hover:gap-3 transition-all w-fit">
                Learn how it works <ArrowRight size={16} />
              </Link>
           </div>
           
           <div className="relative w-full h-[400px] flex items-center justify-center">
              {/* Integration Map Mockup */}
              <div className="w-full h-full bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center p-6 relative">
                 
                 {/* Left Sources */}
                 <motion.div 
                   className="flex flex-col gap-6 z-10 w-1/3"
                   initial="hidden"
                   whileInView="show"
                   viewport={{ once: true }}
                   variants={{
                     hidden: { opacity: 0 },
                     show: { opacity: 1, transition: { staggerChildren: 0.3 } }
                   }}
                 >
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FaLinkedin size={16} fill="currentColor" /></div>
                       <div>
                         <p className="text-[11px] font-bold text-gray-900">LinkedIn</p>
                         <p className="text-[9px] text-gray-500">New position<br/>2 days ago</p>
                       </div>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-gray-100 text-gray-900 flex items-center justify-center shrink-0"><FaGithub size={16} fill="currentColor" /></div>
                       <div>
                         <p className="text-[11px] font-bold text-gray-900">GitHub</p>
                         <p className="text-[9px] text-gray-500">New repository<br/>3 hours ago</p>
                       </div>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-blue-100 text-blue-500 flex items-center justify-center shrink-0"><Award size={16} /></div>
                       <div>
                         <p className="text-[11px] font-bold text-gray-900">Certification</p>
                         <p className="text-[9px] text-gray-500">AWS Solutions...<br/>1 week ago</p>
                       </div>
                    </motion.div>
                 </motion.div>

                 {/* Center AI Node */}
                 <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20">
                    <motion.div 
                      className="w-16 h-16 rounded-full bg-white shadow-xl shadow-accent-200/50 border border-gray-100 flex items-center justify-center relative"
                      animate={{ boxShadow: ["0px 0px 0px rgba(79, 70, 229, 0)", "0px 0px 40px rgba(79, 70, 229, 0.5)", "0px 0px 0px rgba(79, 70, 229, 0)"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                       <div className="absolute inset-0 rounded-full border-2 border-accent-400 border-dashed animate-spin-slow opacity-50" />
                       <div className="w-6 h-6 rounded-sm bg-accent-600 flex items-center justify-center rotate-45">
                          <div className="w-3 h-3 bg-white rounded-sm" />
                       </div>
                    </motion.div>
                 </div>

                 {/* Dotted lines (CSS pseudo) */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path 
                      d="M 33,20 C 45,20 40,50 50,50" className="stroke-gray-200" strokeWidth="0.5" strokeDasharray="2 2" fill="none"
                      initial={{ strokeDashoffset: 20 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path 
                      d="M 33,50 L 50,50" className="stroke-gray-200" strokeWidth="0.5" strokeDasharray="2 2" fill="none"
                      initial={{ strokeDashoffset: 20 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path 
                      d="M 33,80 C 45,80 40,50 50,50" className="stroke-gray-200" strokeWidth="0.5" strokeDasharray="2 2" fill="none"
                      initial={{ strokeDashoffset: 20 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path 
                      d="M 50,50 L 70,50" className="stroke-accent-300" strokeWidth="0.5" strokeDasharray="2 2" fill="none"
                      initial={{ strokeDashoffset: 20 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                 </svg>

                 {/* Right Result Card */}
                 <div className="ml-auto w-1/2 z-10 flex gap-4">
                    <div className="flex-1 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                       <p className="text-[10px] font-bold text-accent-600 mb-3 flex items-center gap-1"><Sparkles size={12} /> AI Update Suggestion</p>
                       <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded border border-green-100">
                             <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> <span className="text-[9px] text-gray-700 font-medium">Add new role at TechNova</span></div>
                             <span className="text-[7px] text-green-600 font-bold">+ Experience</span>
                          </div>
                          <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded border border-green-100">
                             <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> <span className="text-[9px] text-gray-700 font-medium">Add 2 new projects</span></div>
                             <span className="text-[7px] text-green-600 font-bold">+ Projects</span>
                          </div>
                          <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded border border-green-100">
                             <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> <span className="text-[9px] text-gray-700 font-medium">Add AWS Certification</span></div>
                             <span className="text-[7px] text-green-600 font-bold">+ Certificates</span>
                          </div>
                       </div>
                       <button className="w-full bg-accent-600 text-white text-[10px] font-bold py-2 rounded-lg mt-auto hover:bg-accent-700">Review & Apply All</button>
                    </div>

                    <div className="w-[120px] bg-white rounded-xl shadow-md border border-gray-100 p-3 shrink-0 flex flex-col">
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-bold text-gray-900">Your Resume</span>
                         <span className="text-[6px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">Updated</span>
                       </div>
                       <div className="w-full h-1 bg-gray-100 rounded-full mb-1" />
                       <div className="w-2/3 h-1 bg-gray-100 rounded-full mb-3" />
                       
                       <div className="w-full h-0.5 bg-green-200 rounded-full mb-1" />
                       <div className="w-3/4 h-0.5 bg-green-200 rounded-full mb-3" />

                       <div className="w-full h-0.5 bg-gray-100 rounded-full mb-1" />
                       <div className="w-4/5 h-0.5 bg-gray-100 rounded-full mb-1" />
                       <div className="w-full h-0.5 bg-gray-100 rounded-full mb-1" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 4. TAILOR FOR ANY COMPANY */}
      <section className="w-full bg-gray-50 py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
           
           <div className="flex flex-col lg:w-1/3">
              <span className="text-[10px] font-black tracking-widest text-accent-600 uppercase mb-4 block">Tailor for any company</span>
              <h2 className="text-h2 font-extrabold text-gray-900 mb-6 leading-[1.1]">One resume. Any company.</h2>
              <p className="text-body text-gray-600 mb-8">
                AI tailors your resume to match the company's culture, values, and keywords.
              </p>
              <Link href="#" className="text-accent-600 font-bold text-[14px] flex items-center gap-2 hover:gap-3 transition-all w-fit">
                See how it works <ArrowRight size={16} />
              </Link>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:w-2/3">
              {[
                { name: 'Google', icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><FaGoogle size={18} /></div>, tags: ['Leadership', 'Impact', 'Innovation'], score: 94 },
                { name: 'Amazon', icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><FaAmazon size={18} /></div>, tags: ['Ownership', 'Bias for Action', 'Customer Focus'], score: 92 },
                { name: 'Microsoft', icon: <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><FaMicrosoft size={18} /></div>, tags: ['Collaboration', 'Growth Mindset', 'Diversity'], score: 91 },
                { name: 'Startup', icon: <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Sparkles size={16} /></div>, tags: ['Multi-tasking', 'Fast Growth', 'Versatility'], score: 95 }
              ].map((c, i) => (
                <TiltCard key={c.name} className="h-full">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, type: "spring", bounce: 0.4 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center h-full"
                  >
                     <div className="flex items-center gap-2 mb-4 w-full justify-center">
                       {c.icon}
                       <span className="text-[12px] font-bold text-gray-900">{c.name}</span>
                     </div>
                     <div className="w-full flex flex-col gap-2 mb-6">
                       {c.tags.map(t => (
                          <div key={t} className="flex items-center gap-1.5 text-[9px] text-gray-500 font-medium">
                             <Check size={10} className="text-gray-300" /> {t}
                          </div>
                       ))}
                     </div>
                     <div className="mt-auto w-full flex items-center justify-between border-t border-gray-100 pt-3">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ATS Score</span>
                       <div className="w-8 h-8 rounded-full border-[3px] border-green-500 flex items-center justify-center text-[11px] font-black text-gray-900">
                         {c.score}
                       </div>
                     </div>
                  </motion.div>
                </TiltCard>
              ))}
           </div>

        </div>
      </section>

      {/* 5. BOTTOM CTA SECTION */}
      <section className="relative w-full bg-white py-32 px-4 sm:px-6 lg:px-8 border-t border-gray-100 overflow-hidden text-center flex flex-col items-center">
         
         <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute w-full h-full opacity-20" viewBox="0 0 1000 400" preserveAspectRatio="none">
               <path d="M 0,200 C 300,300 700,100 1000,200" className="stroke-accent-600" strokeWidth="2" strokeDasharray="10 10" fill="none" />
            </svg>
            
            {/* Floating items in background */}
            <div className="absolute top-20 left-10 lg:left-[20%] p-4 bg-white rounded-xl shadow-lg border border-gray-100 transform -rotate-6 w-64 text-left">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-gray-900">Job Match</span>
                 <span className="text-[10px] font-bold text-green-500">98% Match</span>
               </div>
               <p className="text-[9px] font-semibold text-gray-500 mb-2">Missing Keywords</p>
               <div className="flex flex-wrap gap-1 mb-4">
                 {['Microservices', 'Docker', 'Kubernetes', 'CI/CD', 'AWS'].map(k => (
                   <span key={k} className="text-[8px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium border border-blue-100">{k}</span>
                 ))}
               </div>
               <button className="w-full bg-accent-600 text-white text-[9px] font-bold py-1.5 rounded flex items-center justify-center gap-1">Optimize Resume <ArrowRight size={10} /></button>
            </div>

            <div className="absolute bottom-20 right-10 lg:right-[15%] w-48 h-64 bg-gray-50 rounded-lg border border-gray-200 transform rotate-12 shadow-xl p-4 flex flex-col gap-2 opacity-50">
               <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center absolute -top-4 -right-4 shadow-lg"><Check size={16} strokeWidth={3} /></div>
               <div className="w-full h-2 bg-gray-200 rounded-full mb-2" />
               <div className="w-2/3 h-2 bg-gray-200 rounded-full" />
               <div className="w-full h-2 bg-gray-200 rounded-full" />
               <div className="w-4/5 h-2 bg-gray-200 rounded-full mb-2" />
               <div className="w-full h-2 bg-gray-200 rounded-full" />
               <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
               <div className="w-full h-2 bg-gray-200 rounded-full mb-2" />
               
               {/* Tiny floaters */}
               <div className="absolute top-1/2 -right-8 w-8 h-8 bg-white rounded shadow border border-gray-100 flex items-center justify-center text-blue-600"><FaLinkedin size={14} fill="currentColor" /></div>
               <div className="absolute bottom-1/4 -right-12 w-8 h-8 bg-white rounded shadow border border-gray-100 flex items-center justify-center text-gray-900"><FaGithub size={14} fill="currentColor" /></div>
            </div>
         </div>

         <span className="text-[10px] font-black tracking-widest text-accent-600 uppercase mb-4 block relative z-10">Smart Tools. Better Careers.</span>
         <h2 className="text-h2 sm:text-h1 font-extrabold text-gray-900 mb-6 relative z-10">Get hired faster<br/>with AI on your side.</h2>
         <p className="text-body text-gray-600 mb-10 max-w-md relative z-10">Join thousands of job seekers building better resumes and landing dream jobs.</p>
         
         <div className="flex flex-col items-center gap-4 relative z-10">
           <Link href="/sign-up">
             <Button variant="accent" size="lg" className="rounded-xl h-14 px-10 text-body font-bold bg-accent-600 hover:bg-accent-700 shadow-lg flex items-center justify-center whitespace-nowrap">
               Start for Free
               <ArrowRight size={18} className="ml-2" />
             </Button>
           </Link>
           <span className="text-[11px] text-gray-500 font-medium">No credit card required</span>
         </div>
      </section>

      {/* Features Footer Strip */}
      <div className="w-full border-t border-gray-100 bg-white py-10 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-center lg:justify-between gap-8 text-center lg:text-left">
            {[
              { i: Target, t: 'ATS Optimized', d: 'Beat the bots' },
              { i: Sparkles, t: 'AI-Powered', d: 'Write better, faster' },
              { i: RefreshCw, t: 'Auto Updated', d: 'Always up to date' },
              { i: Briefcase, t: 'Job Tracker', d: 'Track & win' },
              { i: ShieldCheck, t: 'Privacy First', d: 'Your data is safe' }
            ].map(f => (
               <div key={f.t} className="flex flex-col items-center lg:items-start gap-1">
                 <div className="flex items-center gap-2">
                   <f.i size={16} className="text-gray-400" />
                   <h5 className="text-[12px] font-bold text-gray-900">{f.t}</h5>
                 </div>
                 <p className="text-[10px] text-gray-500 lg:pl-6">{f.d}</p>
               </div>
            ))}
         </div>
      </div>

      <Footer />
    </main>
  );
}
