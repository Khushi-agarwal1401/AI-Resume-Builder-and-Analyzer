"use client";

import { useEffect, useRef } from "react";
import { Sparkles, FileText, BrainCircuit } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

export function PipelineEngineVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Stage Refs
  const cardLiRef = useRef<HTMLDivElement>(null);
  const cardGhRef = useRef<HTMLDivElement>(null);
  const aiNodeRef = useRef<HTMLDivElement>(null);
  const cardResRef = useRef<HTMLDivElement>(null);
  
  // Particle Refs
  const particleLiAi = useRef<SVGCircleElement>(null);
  const particleGhAi = useRef<SVGCircleElement>(null);
  const particleAiRes = useRef<SVGCircleElement>(null);
  
  // Value Refs
  const atsScoreRef = useRef<HTMLDivElement>(null);
  const liStatusRef = useRef<HTMLSpanElement>(null);
  const ghStatusRef = useRef<HTMLSpanElement>(null);
  const resStatusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Entrance Animation
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 80%" } }
      );

      // Main Looping Timeline
      const master = gsap.timeline({
        repeat: -1,
        repeatDelay: 1.5,
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          toggleActions: "play pause resume pause",
        }
      });

      // Reset state at the start of loop
      master.set([particleLiAi.current, particleGhAi.current, particleAiRes.current], { opacity: 0 });
      master.set(atsScoreRef.current, { innerText: "64%" });
      master.set(cardResRef.current, { borderColor: "rgba(226, 232, 240, 1)", boxShadow: "none" }); // Reset Resume Card
      master.set([liStatusRef.current, ghStatusRef.current], { innerText: "Waiting...", color: "#94a3b8" }); // text-slate-400
      master.set(resStatusRef.current, { innerText: "Analyzing...", color: "#94a3b8" }); 

      // 1. Data Ingestion Glow & Status
      master.to([cardLiRef.current, cardGhRef.current], {
        borderColor: "rgba(59, 130, 246, 0.5)",
        boxShadow: "0 4px 20px -2px rgba(59, 130, 246, 0.15)",
        duration: 0.4,
        ease: "power2.out",
      });
      master.set(liStatusRef.current, { innerText: "Fetching...", color: "#3b82f6" }); // text-blue-500
      master.set(ghStatusRef.current, { innerText: "Fetching...", color: "#a855f7" }); // text-purple-500

      // 2. Data Flow from Sources to AI
      master.set([particleLiAi.current, particleGhAi.current], { opacity: 1 });
      master.to(particleLiAi.current, {
        motionPath: { path: "#path-li-ai", align: "#path-li-ai", alignOrigin: [0.5, 0.5] },
        duration: 1.2,
        ease: "power1.inOut"
      }, "+=0.2");
      master.to(particleGhAi.current, {
        motionPath: { path: "#path-gh-ai", align: "#path-gh-ai", alignOrigin: [0.5, 0.5] },
        duration: 1.2,
        ease: "power1.inOut"
      }, "<");

      master.set([particleLiAi.current, particleGhAi.current], { opacity: 0 });
      master.set(liStatusRef.current, { innerText: "Synced ✓", color: "#10b981" }); // text-emerald-500
      master.set(ghStatusRef.current, { innerText: "Synced ✓", color: "#10b981" });
      
      // Turn off source glows
      master.to([cardLiRef.current, cardGhRef.current], {
        borderColor: "rgba(226, 232, 240, 1)",
        boxShadow: "none",
        duration: 0.4
      }, "<");

      // 3. AI Processing Pulse
      master.to(aiNodeRef.current, {
        scale: 1.1,
        boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)",
        duration: 0.5,
        yoyo: true,
        repeat: 3,
        ease: "power1.inOut"
      });

      // 4. Data Flow from AI to Target Resume
      master.set(particleAiRes.current, { opacity: 1 });
      master.to(particleAiRes.current, {
        motionPath: { path: "#path-ai-res", align: "#path-ai-res", alignOrigin: [0.5, 0.5] },
        duration: 1,
        ease: "power1.inOut"
      });
      master.set(particleAiRes.current, { opacity: 0 });

      // 5. Target Resume Updated
      master.to(cardResRef.current, {
        borderColor: "rgba(16, 185, 129, 0.5)",
        boxShadow: "0 4px 20px -2px rgba(16, 185, 129, 0.2)",
        duration: 0.4
      });
      
      const atsCounterObj = { val: 64 };
      master.to(atsCounterObj, {
        val: 98,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          if (atsScoreRef.current) {
            atsScoreRef.current.innerText = `${Math.round(atsCounterObj.val)}%`;
          }
        },
      }, "<");
      
      master.set(resStatusRef.current, { innerText: "Optimized ✓", color: "#10b981" });

      // Hold the success state for a moment before loop restarts
      master.to({}, { duration: 2 });

    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full py-8">
      {/* ─── HEADER ─── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200">
          <Sparkles size={14} className="text-blue-500" /> Seamless Automation
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
          Automated LinkedIn & GitHub Sync
        </h3>
        <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Connect your profiles once. Our AI continuously ingests your latest experience and commits, instantly optimizing your resume to guarantee ATS compliance.
        </p>
      </div>

      {/* ─── PIPELINE VISUAL ─── */}
      <div
        ref={panelRef}
        className="relative w-full max-w-5xl mx-auto bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          
          {/* LEFT: SOURCES */}
          <div className="md:col-span-3 flex flex-col gap-5">
            {/* LinkedIn Card */}
            <div ref={cardLiRef} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative z-10 bg-opacity-95">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  in
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">LinkedIn</div>
                  <div className="text-xs text-gray-400">Experience</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg text-right">
                <span ref={liStatusRef}>Waiting...</span>
              </div>
            </div>

            {/* GitHub Card */}
            <div ref={cardGhRef} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative z-10 bg-opacity-95">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white font-black text-sm flex items-center justify-center shadow-md">
                  GH
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">GitHub</div>
                  <div className="text-xs text-gray-400">Commits</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg text-right">
                <span ref={ghStatusRef}>Waiting...</span>
              </div>
            </div>
          </div>

          {/* CENTER: SVG PATHS & AI ENGINE */}
          <div className="md:col-span-5 relative h-48 md:h-full flex items-center justify-center min-h-[250px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 100" preserveAspectRatio="none">
              {/* Paths */}
              <path id="path-li-ai" d="M 0 25 C 80 25, 120 50, 160 50" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              <path id="path-gh-ai" d="M 0 75 C 80 75, 120 50, 160 50" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              <path id="path-ai-res" d="M 160 50 C 200 50, 260 50, 320 50" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
              
              {/* Particles */}
              <circle ref={particleLiAi} r="6" fill="#3b82f6" opacity="0" filter="drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))" />
              <circle ref={particleGhAi} r="6" fill="#a855f7" opacity="0" filter="drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))" />
              <circle ref={particleAiRes} r="6" fill="#10b981" opacity="0" filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))" />
            </svg>

            {/* AI Engine Core */}
            <div ref={aiNodeRef} className="relative z-10 w-20 h-20 bg-gradient-to-tr from-indigo-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50">
              <BrainCircuit size={32} className="text-white" />
            </div>
            
            <div className="absolute top-[65%] text-[10px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm z-10 tracking-widest uppercase">
              AI Optimizer
            </div>
          </div>

          {/* RIGHT: TARGET RESUME */}
          <div className="md:col-span-3 relative z-10">
            <div ref={cardResRef} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm bg-opacity-95">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="text-base font-black text-gray-900 leading-tight">Master Resume</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Status</span>
                  <span ref={resStatusRef} className="text-xs font-bold text-gray-400">Waiting...</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">ATS Score</span>
                    <span ref={atsScoreRef} className="text-2xl font-black text-emerald-600">64%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
